import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { PipelineService } from '../pipeline/pipeline.service';
import { ProspectsService } from '../prospects/prospects.service';

type CrudResource = 'prospect' | 'pipeline';
type CrudOperation = 'list' | 'get' | 'create' | 'update' | 'delete';

type AgentAction = {
  resource?: CrudResource;
  operation?: CrudOperation;
  id?: string;
  data?: Record<string, unknown>;
};

type AgentState = {
  role: string;
  userId: string;
  message: string;
  action?: AgentAction;
  toolResult?: unknown;
  reply?: string;
};

const AgentStateAnnotation = Annotation.Root({
  role: Annotation<string>(),
  userId: Annotation<string>(),
  message: Annotation<string>(),
  action: Annotation<AgentAction | undefined>(),
  toolResult: Annotation<unknown | undefined>(),
  reply: Annotation<string | undefined>(),
});

const ACTION_SCHEMA = `{
  "resource": "prospect" | "pipeline",
  "operation": "list" | "get" | "create" | "update" | "delete",
  "id": "existing record id when needed",
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
      "expiry": "ISO date",
      "policyId": "string"
    }
  }
}`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private readonly graph = new StateGraph(AgentStateAnnotation)
    .addNode('plan', (state: AgentState) => this.plan(state))
    .addNode('tool', (state: AgentState) => this.runTool(state))
    .addNode('respond', (state: AgentState) => this.respond(state))
    .addEdge(START, 'plan')
    .addEdge('plan', 'tool')
    .addEdge('tool', 'respond')
    .addEdge('respond', END)
    .compile();

  constructor(
    private readonly config: ConfigService,
    private readonly prospectsService: ProspectsService,
    private readonly pipelineService: PipelineService,
  ) {}

  onModuleInit() {
    const model = this.config.get<string>('ai.model') || 'gemma-4-31b-it';
    const apiKey = this.config.get<string>('ai.apiKey');
    if (this.isMissingApiKey(apiKey)) {
      this.logger.warn('Dream AI LangGraph agent is loaded, but no Google API key is configured.');
      return;
    }
    this.logger.log(`Dream AI LangGraph agent ready with model ${model}.`);
  }

  async chat(role: string, userId: string, message: string) {
    const apiKey = this.config.get<string>('ai.apiKey');
    if (this.isMissingApiKey(apiKey)) {
      return { reply: "AI key missing; please configure AI_API_KEY in backend .env" };
    }

    try {
      const result = await this.graph.invoke({ role, userId, message });
      return { reply: result.reply || 'I could not generate a response.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown AI error';
      this.logger.error(`Dream AI agent failed: ${message}`);
      return { reply: `Dream AI could not complete the request: ${message}` };
    }
  }

  private async plan(state: AgentState): Promise<Partial<AgentState>> {
    if (state.role !== 'AGENT' && state.role !== 'ADMIN') {
      return {
        action: undefined,
        toolResult: { error: 'CRM CRUD tools are only available to agents/admins.' },
      };
    }

    const deterministicAction = this.parseDeterministicAction(state.message);
    if (deterministicAction) {
      return { action: deterministicAction };
    }

    const text = await this.generateText([
      'You are the planning node for Dream Agency CRM tools.',
      'Return exactly one compact JSON object and no markdown.',
      'If the user is not asking to list, read, create, update, or delete a prospect or submission pipeline case, return {}.',
      'Allowed action schema:',
      ACTION_SCHEMA,
      `User message: ${state.message}`,
    ].join('\n'));

    const action = this.parseAction(text);
    return { action };
  }

  private async runTool(state: AgentState): Promise<Partial<AgentState>> {
    const action = state.action;
    if (!action?.resource || !action.operation) {
      return { toolResult: { info: 'No CRM CRUD action requested.' } };
    }

    const data = this.actionData(action);
    if ((action.operation === 'get' || action.operation === 'update' || action.operation === 'delete') && !action.id && !this.hasNameLookup(action, data)) {
      return { toolResult: { error: `Missing id for ${action.operation} ${action.resource}.` } };
    }

    if (action.resource === 'prospect') {
      return { toolResult: await this.runProspectTool(action, data, state.userId, state.role) };
    }

    return { toolResult: await this.runPipelineTool(action, data, state.userId, state.role) };
  }

  private async respond(state: AgentState): Promise<Partial<AgentState>> {
    return { reply: this.buildToolReply(state) };
  }

  private async runProspectTool(action: AgentAction, data: Record<string, unknown>, userId: string, role: string) {
    const id = action.id || (await this.resolveProspectIdByName(data.name, userId, role));
    if ((action.operation === 'get' || action.operation === 'update' || action.operation === 'delete') && !id) {
      return { error: `Could not find exactly one prospect matching ${String(data.name || 'that request')}.` };
    }
    switch (action.operation) {
      case 'list':
        return this.prospectsService.list(userId, role);
      case 'get':
        return this.prospectsService.get(id as string, userId, role);
      case 'create':
        return this.prospectsService.create(
          {
            name: String(data.name || ''),
            stage: this.optionalString(data.stage),
            score: this.optionalNumber(data.score),
            contact: this.optionalRecord(data.contact),
            nextActionAt: this.optionalString(data.nextActionAt),
          },
          userId,
          role,
        );
      case 'update':
        return this.prospectsService.update(
          id as string,
          {
            name: this.optionalString(data.name),
            stage: this.optionalString(data.stage),
            score: this.optionalNumber(data.score),
            contact: this.optionalRecord(data.contact),
            nextActionAt: this.optionalString(data.nextActionAt),
          },
          userId,
          role,
        );
      case 'delete':
        return this.prospectsService.delete(id as string, userId, role);
      default:
        return { error: 'Unsupported prospect operation.' };
    }
  }

  private async runPipelineTool(action: AgentAction, data: Record<string, unknown>, userId: string, role: string) {
    const id = action.id || (await this.resolvePipelineIdByName(data.applicantName || data.applicant, userId, role));
    if ((action.operation === 'get' || action.operation === 'update' || action.operation === 'delete') && !id) {
      return { error: `Could not find exactly one submission case matching ${String(data.applicantName || data.applicant || 'that request')}.` };
    }
    switch (action.operation) {
      case 'list':
        return this.pipelineService.list(userId, role);
      case 'get':
        return this.pipelineService.get(id as string, userId, role);
      case 'create':
        return this.pipelineService.create(
          {
            applicantName: String(data.applicantName || data.applicant || ''),
            planName: String(data.planName || data.plan || ''),
            underwritingStatus: this.optionalString(data.underwritingStatus || data.status),
            remarks: this.optionalString(data.remarks),
            pendingReasons: this.optionalStringArray(data.pendingReasons),
            requiredDocs: this.optionalStringArray(data.requiredDocs),
            submittedAt: this.optionalString(data.submittedAt || data.submittedDate),
            estimatedIssueDate: this.optionalString(data.estimatedIssueDate),
            expiry: this.optionalString(data.expiry),
            policyId: this.optionalString(data.policyId),
          },
          userId,
          role,
        );
      case 'update':
        return this.pipelineService.update(
          id as string,
          {
            applicantName: this.optionalString(data.applicantName || data.applicant),
            planName: this.optionalString(data.planName || data.plan),
            underwritingStatus: this.optionalString(data.underwritingStatus || data.status),
            remarks: this.optionalString(data.remarks),
            pendingReasons: this.optionalStringArray(data.pendingReasons),
            requiredDocs: this.optionalStringArray(data.requiredDocs),
            submittedAt: this.optionalString(data.submittedAt || data.submittedDate),
            estimatedIssueDate: this.optionalString(data.estimatedIssueDate),
            expiry: this.optionalString(data.expiry),
            policyId: this.optionalString(data.policyId),
          },
          userId,
          role,
        );
      case 'delete':
        return this.pipelineService.delete(id as string, userId, role);
      default:
        return { error: 'Unsupported pipeline operation.' };
    }
  }

  private async generateText(prompt: string): Promise<string> {
    const apiKey = this.config.get<string>('ai.apiKey') ?? '';
    const model = this.config.get<string>('ai.model') || 'gemma-4-31b-it';
    const ai = new GoogleGenAI({ apiKey });
    const response = await Promise.race([
      ai.models.generateContent({
        model,
        contents: prompt,
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Google model request timed out after 45 seconds')), 45000);
      }),
    ]);
    return response.text || '';
  }

  private buildToolReply(state: AgentState): string {
    const result = state.toolResult as Record<string, unknown> | undefined;
    if (!state.action?.resource || !state.action.operation) {
      return 'I did not detect a CRM change request. Ask me to list, create, update, or delete a prospect or submission pipeline case.';
    }
    if (result?.error) return String(result.error);
    if (Array.isArray(state.toolResult)) {
      return `Found ${state.toolResult.length} ${state.action.resource === 'prospect' ? 'prospect(s)' : 'submission case(s)'}.`;
    }
    if (result?.deleted) return `Deleted ${state.action.resource} ${String(result.id || '')}.`;

    const name =
      typeof result?.name === 'string'
        ? result.name
        : typeof result?.applicant === 'string'
          ? result.applicant
          : typeof result?.applicantName === 'string'
            ? result.applicantName
            : state.action.resource;
    const status =
      typeof result?.status === 'string'
        ? result.status
        : typeof result?.stage === 'string'
          ? result.stage
          : typeof result?.underwritingStatus === 'string'
            ? result.underwritingStatus
            : undefined;
    const probability = typeof result?.probability === 'number' ? `, probability ${result.probability}%` : '';
    const statusText = status ? `, status ${status}` : '';

    const pastTense: Record<CrudOperation, string> = {
      list: 'Listed',
      get: 'Loaded',
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
    };
    return `${pastTense[state.action.operation]} ${state.action.resource} ${name}${statusText}${probability}.`;
  }

  private isMissingApiKey(apiKey: string | undefined): boolean {
    return !apiKey || apiKey === 'your_google_gemini_api_key';
  }

  private parseAction(text: string): AgentAction | undefined {
    const raw = text.trim();
    const jsonText = raw.startsWith('{') ? raw : raw.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonText) return undefined;
    try {
      const parsed = JSON.parse(jsonText) as AgentAction;
      if (!parsed.resource || !parsed.operation) return undefined;
      if (!['prospect', 'pipeline'].includes(parsed.resource)) return undefined;
      if (!['list', 'get', 'create', 'update', 'delete'].includes(parsed.operation)) return undefined;
      return parsed;
    } catch {
      return undefined;
    }
  }

  private parseDeterministicAction(message: string): AgentAction | undefined {
    const text = message.trim();
    const lower = text.toLowerCase();
    const resource = lower.includes('pipeline') || lower.includes('submission') || lower.includes('case')
      ? 'pipeline'
      : lower.includes('prospect')
        ? 'prospect'
        : undefined;
    if (!resource) return undefined;

    const operation = this.detectOperation(lower);
    if (!operation) return undefined;

    const id = this.extractId(text);
    const data = this.extractDeterministicData(text, lower, resource, operation);
    return { resource, operation, id, data };
  }

  private detectOperation(lower: string): CrudOperation | undefined {
    if (/\b(delete|remove)\b/.test(lower)) return 'delete';
    if (/\b(update|edit|change|set)\b/.test(lower)) return 'update';
    if (/\b(create|add|new)\b/.test(lower)) return 'create';
    if (/\b(list|show|all)\b/.test(lower)) return 'list';
    if (/\b(get|find|open|view)\b/.test(lower)) return 'get';
    return undefined;
  }

  private extractId(text: string): string | undefined {
    const explicit = /\bid\s+([a-z0-9_-]+)/i.exec(text)?.[1];
    if (explicit) return explicit.replace(/[.,;:]$/, '');
    return /\b(c[a-z0-9]{12,})\b/i.exec(text)?.[1];
  }

  private extractDeterministicData(
    text: string,
    lower: string,
    resource: CrudResource,
    operation: CrudOperation,
  ): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    const stage = /\b(?:stage|status)\s+(?:to|as|=)\s+([a-z ]+?)(?:\s+and\b|[.,;]|$)/i.exec(text)?.[1];
    const score = /\b(?:score|probability)\s+(?:to|as|=)?\s*(\d{1,3})\b/i.exec(text)?.[1];
    const remarks = /\bremarks?\s+(?:to|as|=)\s+(.+?)(?:[.;]?$)/i.exec(text)?.[1];

    if (resource === 'prospect') {
      const name = this.extractNameAfterResource(text, 'prospect');
      if (name) data.name = name;
      if (operation === 'update' && stage) data.stage = this.titleCase(stage);
      if (score) data.score = Number(score);
    } else {
      const applicantName = this.extractNameAfterResource(text, lower.includes('case') ? 'case' : 'pipeline');
      if (applicantName) data.applicantName = applicantName;
      if (operation === 'update' && stage) data.underwritingStatus = this.titleCase(stage);
      if (remarks) data.remarks = remarks.trim();
    }

    return data;
  }

  private extractNameAfterResource(text: string, resourceWord: string): string | undefined {
    const match = new RegExp(`\\b${resourceWord}\\b\\s+(?:named\\s+|called\\s+|name\\s+)?(.+)$`, 'i').exec(text);
    if (!match) return undefined;
    return match[1]
      .replace(/\bid\s+[a-z0-9_-]+:?/i, '')
      .replace(/\b(set|change|update|edit|delete|remove)\b.*$/i, '')
      .replace(/[.,;:]$/, '')
      .trim();
  }

  private hasNameLookup(action: AgentAction, data: Record<string, unknown>): boolean {
    if (action.resource === 'prospect') return typeof data.name === 'string' && data.name.trim().length > 0;
    if (action.resource === 'pipeline') {
      return typeof data.applicantName === 'string' && data.applicantName.trim().length > 0;
    }
    return false;
  }

  private async resolveProspectIdByName(value: unknown, userId: string, role: string): Promise<string | undefined> {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    const prospects = await this.prospectsService.list(userId, role);
    const match = this.findByName(prospects, value, (item) => item.name);
    return match?.id;
  }

  private async resolvePipelineIdByName(value: unknown, userId: string, role: string): Promise<string | undefined> {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    const cases = await this.pipelineService.list(userId, role);
    const match = this.findByName(cases, value, (item) => item.applicant);
    return match?.id;
  }

  private findByName<T extends { id: string }>(items: T[], query: string, getName: (item: T) => string): T | undefined {
    const normalizedQuery = this.normalizeName(query);
    const exact = items.filter((item) => this.normalizeName(getName(item)) === normalizedQuery);
    if (exact.length === 1) return exact[0];
    const partial = items.filter((item) => this.normalizeName(getName(item)).includes(normalizedQuery));
    return partial.length === 1 ? partial[0] : undefined;
  }

  private normalizeName(value: string): string {
    return value
      .toLowerCase()
      .replace(/^sample:\s*/, '')
      .replace(/\b(the|prospect|pipeline|submission|case)\b/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private titleCase(value: string): string {
    return value
      .trim()
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
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

  private actionData(action: AgentAction): Record<string, unknown> {
    const data = action.data ?? {};
    const nested = action.resource ? data[action.resource] : undefined;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
    return data;
  }
}
