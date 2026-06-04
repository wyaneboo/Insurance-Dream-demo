import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type CrudResource = 'prospect' | 'pipeline';
type CrudOperation = 'list' | 'get' | 'create' | 'update' | 'delete';
type Route = 'repair' | 'finalize';

type AgentAction = {
  resource?: CrudResource;
  operation?: CrudOperation;
  id?: string;
  lookupName?: string;
  fields?: string[];
  data?: Record<string, unknown>;
};

type Evaluation = {
  satisfied: boolean;
  reason: string;
  needsRepair: boolean;
};

type AgentState = {
  role: string;
  userId: string;
  message: string;
  action?: AgentAction;
  toolResult?: unknown;
  evaluation?: Evaluation;
  reply?: string;
  attempts?: number;
};

const AgentStateAnnotation = Annotation.Root({
  role: Annotation<string>(),
  userId: Annotation<string>(),
  message: Annotation<string>(),
  action: Annotation<AgentAction | undefined>(),
  toolResult: Annotation<unknown | undefined>(),
  evaluation: Annotation<Evaluation | undefined>(),
  reply: Annotation<string | undefined>(),
  attempts: Annotation<number | undefined>(),
});

const ACTION_SCHEMA = `{
  "resource": "prospect" | "pipeline",
  "operation": "list" | "get" | "create" | "update" | "delete",
  "id": "optional exact row id",
  "lookupName": "optional prospect name or submission applicant name",
  "fields": ["only fields the user requested"],
  "data": {
    "prospect": {
      "name": "string",
      "stage": "New | Contacted | Proposal | Closing",
      "score": 0-100,
      "contact": { "email": "string", "phone": "string" },
      "nextActionAt": "ISO date"
    },
    "pipeline": {
      "applicantName": "string",
      "planName": "string",
      "underwritingStatus": "Submitted | Underwriting | Pending Requirement",
      "remarks": "string",
      "pendingReasons": ["string"],
      "requiredDocs": ["string"],
      "submittedAt": "ISO date",
      "estimatedIssueDate": "ISO date",
      "expiry": "ISO date"
    }
  }
}`;

const DEFAULT_AI_MODEL = 'gemini-2.5-flash';
const MODEL_TIMEOUT_MS = 30000;

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);

  private readonly graph = new StateGraph(AgentStateAnnotation)
    .addNode('plan', (state: AgentState) => this.plan(state))
    .addNode('tool', (state: AgentState) => this.runTool(state))
    .addNode('evaluate', (state: AgentState) => this.evaluate(state))
    .addNode('repair', (state: AgentState) => this.repair(state))
    .addNode('finalize', (state: AgentState) => this.finalize(state))
    .addEdge(START, 'plan')
    .addEdge('plan', 'tool')
    .addEdge('tool', 'evaluate')
    .addConditionalEdges('evaluate', (state: AgentState) => this.routeAfterEvaluation(state), {
      repair: 'repair',
      finalize: 'finalize',
    })
    .addEdge('repair', 'tool')
    .addEdge('finalize', END)
    .compile();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const model = this.config.get<string>('ai.model') || DEFAULT_AI_MODEL;
    const apiKey = this.config.get<string>('ai.apiKey');
    if (this.isMissingApiKey(apiKey)) {
      this.logger.warn('Dream AI LangGraph agent is loaded, but no Google API key is configured.');
      return;
    }
    this.logger.log(`Dream AI LangGraph agent ready with model ${model}.`);
  }

  async chat(role: string, userId: string, message: string) {
    try {
      const result = await this.graph.invoke({ role, userId, message, attempts: 0 });
      return { reply: result.reply || 'I could not generate a response.' };
    } catch (error) {
      const message = this.describeProviderError(error);
      this.logger.error(`Dream AI agent failed: ${message}`);
      return { reply: `Dream AI could not complete the request right now. ${message}` };
    }
  }

  private async plan(state: AgentState): Promise<Partial<AgentState>> {
    const apiKey = this.config.get<string>('ai.apiKey');
    if (this.isMissingApiKey(apiKey)) {
      return {
        reply: 'Dream AI is not configured yet. Add a backend AI key before using the assistant.',
        attempts: 0,
      };
    }

    const text = await this.generateText([
      'You are the planning node for Dream AI Assistant.',
      'Every user message must go through this agent plan.',
      'Return exactly one compact JSON object and no markdown.',
      'If the user needs CRM database work, return one tool action using the schema below.',
      'Only AGENT and ADMIN roles may use CRM tools. For any other role, return a normal reply and do not plan a tool.',
      'For comparisons, rankings, counts, lowest/highest, second-lowest/second-highest, or "which record has" questions, use operation "list" and include the fields needed to answer.',
      'Use operation "get", "update", or "delete" only when the user gives an exact row id or a specific prospect/applicant name.',
      'Never put words like "has the lowest", "highest probability", or another comparative phrase in lookupName.',
      'If no CRM tool is needed, return {"reply":"a concise helpful assistant response"}.',
      'Allowed CRM action schema:',
      ACTION_SCHEMA,
      'Example for "which prospect has the lowest probability and which one is second lowest": {"resource":"prospect","operation":"list","fields":["name","probability"]}',
      `User role: ${state.role}`,
      `User message: ${state.message}`,
    ].join('\n'));

    const action = this.parseAction(text);
    if (action) return { action, attempts: 0 };

    return {
      reply: this.parseReply(text) || await this.generateConversationReply(state),
      attempts: 0,
    };
  }

  private async runTool(state: AgentState): Promise<Partial<AgentState>> {
    const action = state.action;
    if (state.reply && (!action?.resource || !action.operation)) {
      return { toolResult: { skipped: true, reason: 'No CRM tool needed.' } };
    }

    if (!action?.resource || !action.operation) {
      return { toolResult: state.toolResult || { error: 'I could not identify a CRM CRUD request.' } };
    }

    if (state.role !== 'AGENT' && state.role !== 'ADMIN') {
      return { toolResult: { error: 'CRM CRUD tools are only available to agents/admins.' } };
    }

    if (action.resource === 'prospect') {
      return { toolResult: await this.runProspectTool(action, state.userId, state.role) };
    }

    return { toolResult: await this.runPipelineTool(action, state.userId, state.role) };
  }

  private evaluate(state: AgentState): Partial<AgentState> {
    const result = state.toolResult as Record<string, unknown> | unknown[] | undefined;
    const action = state.action;
    if (state.reply && (!action?.resource || !action.operation)) {
      return {
        evaluation: { satisfied: true, reason: 'Conversation reply planned without a tool.', needsRepair: false },
      };
    }

    if (!action?.resource || !action.operation) {
      return {
        evaluation: { satisfied: false, reason: 'No tool action was planned.', needsRepair: false },
      };
    }

    if (result && !Array.isArray(result) && typeof result === 'object' && 'error' in result) {
      return {
        evaluation: { satisfied: false, reason: String((result as Record<string, unknown>).error), needsRepair: false },
      };
    }

    const missingFields = this.missingRequestedFields(result, action.fields);
    if (missingFields.length > 0) {
      return {
        evaluation: {
          satisfied: false,
          reason: `Tool result missed requested field(s): ${missingFields.join(', ')}`,
          needsRepair: (state.attempts || 0) < 1,
        },
      };
    }

    return {
      evaluation: { satisfied: true, reason: 'Tool result satisfies the user query.', needsRepair: false },
    };
  }

  private routeAfterEvaluation(state: AgentState): Route {
    return state.evaluation?.needsRepair ? 'repair' : 'finalize';
  }

  private repair(state: AgentState): Partial<AgentState> {
    const action = state.action;
    if (!action?.resource || !action.operation) return { attempts: (state.attempts || 0) + 1 };

    return {
      attempts: (state.attempts || 0) + 1,
      action: {
        ...action,
        fields: this.defaultFields(action.resource, action.operation),
      },
    };
  }

  private async finalize(state: AgentState): Promise<Partial<AgentState>> {
    return { reply: await this.buildReply(state) };
  }

  private async runProspectTool(action: AgentAction, userId: string, role: string) {
    const data = this.actionData(action);
    const id = action.id || (await this.resolveProspectId(action.lookupName || data.name, userId, role));

    switch (action.operation) {
      case 'list':
        return this.listProspects(userId, role, action.fields);
      case 'get':
        if (!id) return { error: `Could not find exactly one prospect matching ${String(action.lookupName || data.name || 'that request')}.` };
        return this.getProspect(id, userId, role, action.fields);
      case 'create':
        return this.createProspect(data, userId, action.fields);
      case 'update':
        if (!id) return { error: `Could not find exactly one prospect matching ${String(action.lookupName || data.name || 'that request')}.` };
        return this.updateProspect(id, data, userId, role, action.fields);
      case 'delete':
        if (!id) return { error: `Could not find exactly one prospect matching ${String(action.lookupName || data.name || 'that request')}.` };
        return this.deleteProspect(id, userId, role);
      default:
        return { error: 'Unsupported prospect operation.' };
    }
  }

  private async runPipelineTool(action: AgentAction, userId: string, role: string) {
    const data = this.actionData(action);
    const id = action.id || (await this.resolvePipelineId(action.lookupName || data.applicantName || data.applicant, userId, role));

    switch (action.operation) {
      case 'list':
        return this.listPipeline(userId, role, action.fields);
      case 'get':
        if (!id) return { error: `Could not find exactly one submission case matching ${String(action.lookupName || data.applicantName || data.applicant || 'that request')}.` };
        return this.getPipeline(id, userId, role, action.fields);
      case 'create':
        return this.createPipeline(data, userId, action.fields);
      case 'update':
        if (!id) return { error: `Could not find exactly one submission case matching ${String(action.lookupName || data.applicantName || data.applicant || 'that request')}.` };
        return this.updatePipeline(id, data, userId, role, action.fields);
      case 'delete':
        if (!id) return { error: `Could not find exactly one submission case matching ${String(action.lookupName || data.applicantName || data.applicant || 'that request')}.` };
        return this.deletePipeline(id, userId, role);
      default:
        return { error: 'Unsupported pipeline operation.' };
    }
  }

  private listProspects(userId: string, role: string, requestedFields?: string[]) {
    const fields = this.normalizeFields('prospect', requestedFields, 'list');
    return this.prisma.prospect
      .findMany({
        where: this.prospectScope(userId, role),
        select: this.prospectSelect(fields),
        orderBy: { updatedAt: 'desc' },
      })
      .then((items) => items.map((item) => this.projectProspect(item, fields)));
  }

  private getProspect(id: string, userId: string, role: string, requestedFields?: string[]) {
    const fields = this.normalizeFields('prospect', requestedFields, 'get');
    return this.prisma.prospect
      .findFirst({
        where: { id, ...this.prospectScope(userId, role) },
        select: this.prospectSelect(fields),
      })
      .then((item) => item ? this.projectProspect(item, fields) : { error: 'Prospect not found.' });
  }

  private async createProspect(data: Record<string, unknown>, userId: string, requestedFields?: string[]) {
    const fields = this.normalizeFields('prospect', requestedFields, 'create');
    const contact = this.optionalRecord(data.contact);
    const created = await this.prisma.prospect.create({
      data: {
        agentId: userId,
        name: String(data.name || ''),
        stage: this.optionalString(data.stage) || 'New',
        score: this.optionalNumber(data.score),
        contact: (contact || {}) as Prisma.InputJsonValue,
        nextActionAt: this.optionalDate(data.nextActionAt),
      },
      select: this.prospectSelect(fields),
    });
    return this.projectProspect(created, fields);
  }

  private async updateProspect(id: string, data: Record<string, unknown>, userId: string, role: string, requestedFields?: string[]) {
    await this.ensureProspect(id, userId, role);
    const fields = this.normalizeFields('prospect', requestedFields, 'update');
    const contact = this.optionalRecord(data.contact);
    const updated = await this.prisma.prospect.update({
      where: { id },
      data: {
        name: this.optionalString(data.name),
        stage: this.optionalString(data.stage),
        score: this.optionalNumber(data.score),
        contact: contact === undefined ? undefined : contact as Prisma.InputJsonValue,
        nextActionAt: this.optionalDate(data.nextActionAt),
      },
      select: this.prospectSelect(fields),
    });
    return this.projectProspect(updated, fields);
  }

  private async deleteProspect(id: string, userId: string, role: string) {
    const existing = await this.ensureProspect(id, userId, role);
    await this.prisma.prospectNote.deleteMany({ where: { prospectId: id } });
    await this.prisma.prospect.delete({ where: { id } });
    return { deleted: true, id, name: existing.name };
  }

  private listPipeline(userId: string, role: string, requestedFields?: string[]) {
    const fields = this.normalizeFields('pipeline', requestedFields, 'list');
    return this.prisma.pipelineCase
      .findMany({
        where: this.pipelineScope(userId, role),
        select: this.pipelineSelect(fields),
        orderBy: { updatedAt: 'desc' },
      })
      .then((items) => items.map((item) => this.projectPipeline(item, fields)));
  }

  private getPipeline(id: string, userId: string, role: string, requestedFields?: string[]) {
    const fields = this.normalizeFields('pipeline', requestedFields, 'get');
    return this.prisma.pipelineCase
      .findFirst({
        where: { id, ...this.pipelineScope(userId, role) },
        select: this.pipelineSelect(fields),
      })
      .then((item) => item ? this.projectPipeline(item, fields) : { error: 'Submission case not found.' });
  }

  private async createPipeline(data: Record<string, unknown>, userId: string, requestedFields?: string[]) {
    const fields = this.normalizeFields('pipeline', requestedFields, 'create');
    const created = await this.prisma.pipelineCase.create({
      data: {
        agentId: userId,
        applicantName: String(data.applicantName || data.applicant || ''),
        planName: String(data.planName || data.plan || ''),
        underwritingStatus: this.optionalString(data.underwritingStatus || data.status) || 'Submitted',
        remarks: this.optionalString(data.remarks),
        pendingReasons: this.optionalStringArray(data.pendingReasons),
        requiredDocs: this.optionalStringArray(data.requiredDocs),
        submittedAt: this.optionalDate(data.submittedAt || data.submittedDate),
        estimatedIssueDate: this.optionalDate(data.estimatedIssueDate),
        expiry: this.optionalDate(data.expiry),
      },
      select: this.pipelineSelect(fields),
    });
    return this.projectPipeline(created, fields);
  }

  private async updatePipeline(id: string, data: Record<string, unknown>, userId: string, role: string, requestedFields?: string[]) {
    await this.ensurePipeline(id, userId, role);
    const fields = this.normalizeFields('pipeline', requestedFields, 'update');
    const updated = await this.prisma.pipelineCase.update({
      where: { id },
      data: {
        applicantName: this.optionalString(data.applicantName || data.applicant),
        planName: this.optionalString(data.planName || data.plan),
        underwritingStatus: this.optionalString(data.underwritingStatus || data.status),
        remarks: this.optionalString(data.remarks),
        pendingReasons: this.optionalStringArray(data.pendingReasons),
        requiredDocs: this.optionalStringArray(data.requiredDocs),
        submittedAt: this.optionalDate(data.submittedAt || data.submittedDate),
        estimatedIssueDate: this.optionalDate(data.estimatedIssueDate),
        expiry: this.optionalDate(data.expiry),
      },
      select: this.pipelineSelect(fields),
    });
    return this.projectPipeline(updated, fields);
  }

  private async deletePipeline(id: string, userId: string, role: string) {
    const existing = await this.ensurePipeline(id, userId, role);
    await this.prisma.pipelineCase.delete({ where: { id } });
    return { deleted: true, id, applicant: existing.applicantName };
  }

  private async generateText(prompt: string): Promise<string> {
    const apiKey = this.config.get<string>('ai.apiKey') ?? '';
    const configuredModel = this.config.get<string>('ai.model') || DEFAULT_AI_MODEL;
    const models = Array.from(new Set([configuredModel, DEFAULT_AI_MODEL]));
    const ai = new GoogleGenAI({ apiKey });

    let lastError: unknown;
    for (const model of models) {
      try {
        const response = await Promise.race([
          ai.models.generateContent({ model, contents: prompt }),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Google model request timed out after ${MODEL_TIMEOUT_MS / 1000} seconds`)), MODEL_TIMEOUT_MS);
          }),
        ]);
        return response.text || '';
      } catch (error) {
        lastError = error;
        if (model !== DEFAULT_AI_MODEL) {
          this.logger.warn(`AI model ${model} failed; retrying with ${DEFAULT_AI_MODEL}. ${this.describeProviderError(error)}`);
        }
      }
    }

    throw new Error(this.describeProviderError(lastError));
  }

  private async buildReply(state: AgentState): Promise<string> {
    if (state.reply) return state.reply;

    const result = state.toolResult as Record<string, unknown> | unknown[] | undefined;
    const action = state.action;
    if (!action?.resource || !action.operation) {
      return this.readableError(state.toolResult) || 'Tell me which database you want to organize: prospects or submission pipeline.';
    }
    if (state.evaluation && !state.evaluation.satisfied && !state.evaluation.needsRepair) {
      return this.readableError(result) || state.evaluation.reason;
    }
    const insight = this.buildStructuredInsight(state);
    if (insight) return insight;

    try {
      const final = await this.generateFinalReply(state);
      if (final.trim()) return final.trim();
    } catch (error) {
      this.logger.warn(`AI finalization failed; using local formatter. ${this.describeProviderError(error)}`);
    }

    return this.buildToolFallbackReply(state);
  }

  private buildToolFallbackReply(state: AgentState): string {
    const result = state.toolResult as Record<string, unknown> | unknown[] | undefined;
    const action = state.action;
    if (!action?.resource || !action.operation) {
      return this.readableError(state.toolResult) || 'Tell me which database you want to organize: prospects or submission pipeline.';
    }
    if (state.evaluation && !state.evaluation.satisfied && !state.evaluation.needsRepair) {
      return this.readableError(result) || state.evaluation.reason;
    }
    if (Array.isArray(result)) return this.formatList(action.resource, result);
    if (result && typeof result === 'object') return this.formatObject(action, result as Record<string, unknown>);
    return 'Done.';
  }

  private async generateConversationReply(state: AgentState): Promise<string> {
    const text = await this.generateText([
      'You are Dream AI Assistant in an insurance agency CRM.',
      'Answer normally and concisely.',
      'If the user asks to change CRM data, say you need a clear CRM request instead of pretending it was done.',
      `User role: ${state.role}`,
      `User message: ${state.message}`,
    ].join('\n'));
    return text.trim() || 'How can I help?';
  }

  private async generateFinalReply(state: AgentState): Promise<string> {
    const text = await this.generateText([
      'You are Dream AI Assistant finalizing a CRM tool result.',
      'Answer the user using only the tool result. Do not invent rows or values.',
      'For probabilities and scores, compare numbers numerically.',
      'If the tool result is a mutation, confirm only what changed.',
      'Do not mention internal tool names, JSON, Prisma, LangGraph, or model details.',
      `User message: ${state.message}`,
      `Planned action: ${JSON.stringify(state.action)}`,
      `Tool result: ${JSON.stringify(state.toolResult)}`,
    ].join('\n'));
    return text.trim();
  }

  private buildStructuredInsight(state: AgentState): string | undefined {
    return this.buildProspectProbabilityInsight(state);
  }

  private buildProspectProbabilityInsight(state: AgentState): string | undefined {
    const action = state.action;
    const rows = state.toolResult;
    const lower = state.message.toLowerCase();
    if (action?.resource !== 'prospect' || !Array.isArray(rows)) return undefined;
    if (!/\b(probability|score)\b/.test(lower) || !/\b(lowest|highest|second|higher|lower)\b/.test(lower)) return undefined;

    const prospects = rows
      .map((row) => {
        const record = row as Record<string, unknown>;
        const probability = this.numericValue(record.probability);
        return {
          name: String(record.name || record.id || 'Unnamed prospect'),
          probability,
        };
      })
      .filter((row): row is { name: string; probability: number } => row.probability !== undefined)
      .sort((a, b) => a.probability - b.probability);

    if (prospects.length === 0) return 'I could not find any prospect probability values to compare.';

    if (lower.includes('highest')) {
      const highest = prospects[prospects.length - 1];
      const secondHighest = prospects[prospects.length - 2];
      if (secondHighest && /\b(second|lower)\b/.test(lower)) {
        return `The highest-probability prospect is ${highest.name} at ${this.formatProbability(highest.probability)}. The next lower prospect is ${secondHighest.name} at ${this.formatProbability(secondHighest.probability)}.`;
      }
      return `The highest-probability prospect is ${highest.name} at ${this.formatProbability(highest.probability)}.`;
    }

    if (lower.includes('lowest')) {
      const lowest = prospects[0];
      const nextHigher = prospects[1];
      if (nextHigher && /\b(second|higher|slightly)\b/.test(lower)) {
        return `The lowest-probability prospect is ${lowest.name} at ${this.formatProbability(lowest.probability)}. The next higher prospect is ${nextHigher.name} at ${this.formatProbability(nextHigher.probability)}.`;
      }
      return `The lowest-probability prospect is ${lowest.name} at ${this.formatProbability(lowest.probability)}.`;
    }

    return undefined;
  }

  private formatList(resource: CrudResource, rows: unknown[]): string {
    if (rows.length === 0) return `No ${resource === 'prospect' ? 'prospects' : 'submission cases'} found.`;
    const header = resource === 'prospect' ? 'Prospects' : 'Submission cases';
    return `${header}:\n${rows.map((row, index) => `${index + 1}. ${this.formatRow(row as Record<string, unknown>)}`).join('\n')}`;
  }

  private formatObject(action: AgentAction, row: Record<string, unknown>): string {
    if (row.error) return String(row.error);
    if (row.deleted) {
      const label = action.resource === 'prospect' ? row.name : row.applicant;
      return `Deleted ${action.resource} ${String(label || row.id || '')}.`;
    }
    const verbs: Record<CrudOperation, string> = {
      list: 'Listed',
      get: 'Loaded',
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
    };
    return `${verbs[action.operation as CrudOperation]} ${action.resource}: ${this.formatRow(row)}.`;
  }

  private formatRow(row: Record<string, unknown>): string {
    return Object.entries(row)
      .map(([key, value]) => `${this.fieldLabel(key)}: ${this.formatValue(value)}`)
      .join(', ');
  }

  private parseAction(text: string): AgentAction | undefined {
    const parsed = this.parseJsonObject(text);
    const candidate = parsed?.action && typeof parsed.action === 'object' && !Array.isArray(parsed.action)
      ? parsed.action as Record<string, unknown>
      : parsed;
    if (!candidate) return undefined;
    try {
      const parsed = candidate as AgentAction;
      if (!parsed.resource || !parsed.operation) return undefined;
      if (!['prospect', 'pipeline'].includes(parsed.resource)) return undefined;
      if (!['list', 'get', 'create', 'update', 'delete'].includes(parsed.operation)) return undefined;
      return {
        ...parsed,
        fields: this.normalizeFields(parsed.resource, parsed.fields, parsed.operation),
      };
    } catch {
      return undefined;
    }
  }

  private parseReply(text: string): string | undefined {
    const parsed = this.parseJsonObject(text);
    const reply = parsed?.reply;
    return typeof reply === 'string' && reply.trim() ? reply.trim() : undefined;
  }

  private parseJsonObject(text: string): Record<string, unknown> | undefined {
    const raw = text.trim();
    const jsonText = raw.startsWith('{') ? raw : raw.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonText) return undefined;
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : undefined;
    } catch {
      return undefined;
    }
  }

  private normalizeFields(resource: CrudResource, fields: unknown, operation: CrudOperation): string[] {
    const raw = Array.isArray(fields) ? fields.filter((field): field is string => typeof field === 'string') : [];
    const normalized = raw
      .map((field) => this.normalizeField(resource, field))
      .filter((field): field is string => !!field);
    const unique = Array.from(new Set(normalized));
    return unique.length > 0 ? unique : this.defaultFields(resource, operation);
  }

  private normalizeField(resource: CrudResource, field: string): string | undefined {
    const normalized = field.toLowerCase().replace(/[^a-z]/g, '');
    if (resource === 'prospect') {
      if (['id'].includes(normalized)) return 'id';
      if (['name', 'prospectname'].includes(normalized)) return 'name';
      if (['stage', 'status'].includes(normalized)) return 'stage';
      if (['score', 'probability'].includes(normalized)) return 'probability';
      if (['email'].includes(normalized)) return 'email';
      if (['phone'].includes(normalized)) return 'phone';
      if (['nextaction', 'nextactionat'].includes(normalized)) return 'nextActionAt';
      if (['lastcontact', 'updatedat'].includes(normalized)) return 'lastContact';
    } else {
      if (['id'].includes(normalized)) return 'id';
      if (['applicant', 'applicantname', 'name'].includes(normalized)) return 'applicant';
      if (['plan', 'planname'].includes(normalized)) return 'plan';
      if (['status', 'underwritingstatus'].includes(normalized)) return 'status';
      if (['submitted', 'submittedat', 'submitteddate'].includes(normalized)) return 'submittedDate';
      if (['remarks', 'remark'].includes(normalized)) return 'remarks';
      if (['pendingreasons', 'pendingreason'].includes(normalized)) return 'pendingReasons';
      if (['requireddocs', 'requireddocuments'].includes(normalized)) return 'requiredDocs';
    }
    return undefined;
  }

  private defaultFields(resource: CrudResource, operation: CrudOperation): string[] {
    if (resource === 'prospect') {
      return operation === 'delete' ? ['id', 'name'] : ['id', 'name', 'stage', 'probability'];
    }
    return operation === 'delete' ? ['id', 'applicant'] : ['id', 'applicant', 'plan', 'status'];
  }

  private prospectSelect(fields: string[]): Record<string, true> {
    const select: Record<string, true> = {};
    for (const field of fields) {
      if (field === 'probability') select.score = true;
      else if (field === 'stage') select.stage = true;
      else if (field === 'email' || field === 'phone') select.contact = true;
      else if (field === 'lastContact') select.updatedAt = true;
      else select[field] = true;
    }
    return select;
  }

  private pipelineSelect(fields: string[]): Record<string, true> {
    const select: Record<string, true> = {};
    for (const field of fields) {
      if (field === 'applicant') select.applicantName = true;
      else if (field === 'plan') select.planName = true;
      else if (field === 'status') select.underwritingStatus = true;
      else if (field === 'submittedDate') select.submittedAt = true;
      else select[field] = true;
    }
    return select;
  }

  private projectProspect(row: Record<string, any>, fields: string[]): Record<string, unknown> {
    const output: Record<string, unknown> = {};
    for (const field of fields) {
      if (field === 'probability') output.probability = row.score ?? 0;
      else if (field === 'email') output.email = row.contact?.email ?? '';
      else if (field === 'phone') output.phone = row.contact?.phone ?? '';
      else if (field === 'lastContact') output.lastContact = this.iso(row.updatedAt);
      else if (field === 'nextActionAt') output.nextActionAt = this.iso(row.nextActionAt);
      else output[field] = row[field];
    }
    return output;
  }

  private projectPipeline(row: Record<string, any>, fields: string[]): Record<string, unknown> {
    const output: Record<string, unknown> = {};
    for (const field of fields) {
      if (field === 'applicant') output.applicant = row.applicantName;
      else if (field === 'plan') output.plan = row.planName;
      else if (field === 'status') output.status = row.underwritingStatus;
      else if (field === 'submittedDate') output.submittedDate = this.iso(row.submittedAt);
      else output[field] = row[field];
    }
    return output;
  }

  private missingRequestedFields(result: unknown, fields?: string[]): string[] {
    if (!fields || fields.length === 0) return [];
    if (Array.isArray(result)) {
      if (result.length === 0) return [];
      const first = result[0] as Record<string, unknown>;
      return fields.filter((field) => !(field in first));
    }
    if (result && typeof result === 'object') {
      const row = result as Record<string, unknown>;
      if (row.error || row.deleted) return [];
      return fields.filter((field) => !(field in row));
    }
    return fields;
  }

  private async resolveProspectId(value: unknown, userId: string, role: string): Promise<string | undefined> {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    const candidates = await this.prisma.prospect.findMany({
      where: { ...this.prospectScope(userId, role), name: { contains: value, mode: 'insensitive' } },
      select: { id: true, name: true },
      take: 5,
    });
    return this.pickSingleNameMatch(candidates, value);
  }

  private async resolvePipelineId(value: unknown, userId: string, role: string): Promise<string | undefined> {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    const candidates = await this.prisma.pipelineCase.findMany({
      where: { ...this.pipelineScope(userId, role), applicantName: { contains: value, mode: 'insensitive' } },
      select: { id: true, applicantName: true },
      take: 5,
    });
    return this.pickSingleNameMatch(candidates.map((item) => ({ id: item.id, name: item.applicantName })), value);
  }

  private pickSingleNameMatch(items: Array<{ id: string; name: string }>, query: string): string | undefined {
    const normalizedQuery = this.normalizeName(query);
    const exact = items.filter((item) => this.normalizeName(item.name) === normalizedQuery);
    if (exact.length === 1) return exact[0].id;
    const partial = items.filter((item) => this.normalizeName(item.name).includes(normalizedQuery));
    return partial.length === 1 ? partial[0].id : undefined;
  }

  private async ensureProspect(id: string, userId: string, role: string) {
    const prospect = await this.prisma.prospect.findFirst({
      where: { id, ...this.prospectScope(userId, role) },
      select: { id: true, name: true },
    });
    if (!prospect) throw new Error('Prospect not found.');
    return prospect;
  }

  private async ensurePipeline(id: string, userId: string, role: string) {
    const item = await this.prisma.pipelineCase.findFirst({
      where: { id, ...this.pipelineScope(userId, role) },
      select: { id: true, applicantName: true },
    });
    if (!item) throw new Error('Submission case not found.');
    return item;
  }

  private prospectScope(userId: string, role: string) {
    return role === 'ADMIN' ? {} : { agentId: userId };
  }

  private pipelineScope(userId: string, role: string) {
    return role === 'ADMIN' ? {} : { OR: [{ agentId: userId }, { policy: { agentId: userId } }] };
  }

  private actionData(action: AgentAction): Record<string, unknown> {
    const data = action.data ?? {};
    const nested = action.resource ? data[action.resource] : undefined;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) return nested as Record<string, unknown>;
    return data;
  }

  private readableError(result: unknown): string | undefined {
    return result && typeof result === 'object' && 'error' in result ? String((result as Record<string, unknown>).error) : undefined;
  }

  private normalizeName(value: string): string {
    return value
      .toLowerCase()
      .replace(/^sample:\s*/, '')
      .replace(/\b(the|prospect|pipeline|submission|case)\b/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private fieldLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase());
  }

  private formatValue(value: unknown): string {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.join(', ');
    if (value && typeof value === 'object') return JSON.stringify(value);
    return String(value ?? '');
  }

  private iso(value: unknown): string | undefined {
    return value instanceof Date ? value.toISOString() : undefined;
  }

  private optionalString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private optionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private optionalRecord(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
  }

  private optionalStringArray(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) return undefined;
    return value.filter((item): item is string => typeof item === 'string');
  }

  private optionalDate(value: unknown): Date | undefined {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private numericValue(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value.replace('%', '').trim());
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private formatProbability(value: number): string {
    return `${Number.isInteger(value) ? value : Number(value.toFixed(2))}%`;
  }

  private describeProviderError(error: unknown): string {
    const raw = error instanceof Error ? error.message : String(error || 'Unknown AI error');
    try {
      const parsed = JSON.parse(raw) as { error?: { message?: string; status?: string } };
      const message = parsed.error?.message || 'AI provider request failed.';
      const status = parsed.error?.status;
      return status ? `AI provider returned ${status}: ${message}` : `AI provider returned an error: ${message}`;
    } catch {
      return raw || 'Unknown AI error';
    }
  }

  private isMissingApiKey(apiKey: string | undefined): boolean {
    return !apiKey || apiKey === 'your_google_gemini_api_key';
  }
}
