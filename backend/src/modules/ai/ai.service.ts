import { Injectable } from '@nestjs/common';
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

  async chat(role: string, userId: string, message: string) {
    const apiKey = this.config.get<string>('ai.apiKey');
    if (this.isMissingApiKey(apiKey)) {
      return { reply: "AI key missing; please configure AI_API_KEY in backend .env" };
    }

    const result = await this.graph.invoke({ role, userId, message });
    return { reply: result.reply || 'I could not generate a response.' };
  }

  private async plan(state: AgentState): Promise<Partial<AgentState>> {
    if (state.role !== 'AGENT' && state.role !== 'ADMIN') {
      return {
        action: undefined,
        toolResult: { error: 'CRM CRUD tools are only available to agents/admins.' },
      };
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

    const data = action.data ?? {};
    if ((action.operation === 'get' || action.operation === 'update' || action.operation === 'delete') && !action.id) {
      return { toolResult: { error: `Missing id for ${action.operation} ${action.resource}.` } };
    }

    if (action.resource === 'prospect') {
      return { toolResult: await this.runProspectTool(action, data, state.userId, state.role) };
    }

    return { toolResult: await this.runPipelineTool(action, data, state.userId, state.role) };
  }

  private async respond(state: AgentState): Promise<Partial<AgentState>> {
    const reply = await this.generateText([
      state.role === 'AGENT'
        ? 'You are Dream AI Assistant for insurance agents. Be concise, operational, and clear.'
        : 'You are Dream AI Assistant for insurance customers. Be concise and friendly.',
      'Summarize the outcome. If a tool produced data, mention the important fields and next step.',
      `User message: ${state.message}`,
      `Tool result: ${JSON.stringify(state.toolResult)}`,
    ].join('\n'));

    return { reply };
  }

  private async runProspectTool(action: AgentAction, data: Record<string, unknown>, userId: string, role: string) {
    switch (action.operation) {
      case 'list':
        return this.prospectsService.list(userId, role);
      case 'get':
        return this.prospectsService.get(action.id as string, userId, role);
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
          action.id as string,
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
        return this.prospectsService.delete(action.id as string, userId, role);
      default:
        return { error: 'Unsupported prospect operation.' };
    }
  }

  private async runPipelineTool(action: AgentAction, data: Record<string, unknown>, userId: string, role: string) {
    switch (action.operation) {
      case 'list':
        return this.pipelineService.list(userId, role);
      case 'get':
        return this.pipelineService.get(action.id as string, userId, role);
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
          action.id as string,
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
        return this.pipelineService.delete(action.id as string, userId, role);
      default:
        return { error: 'Unsupported pipeline operation.' };
    }
  }

  private async generateText(prompt: string): Promise<string> {
    const apiKey = this.config.get<string>('ai.apiKey') ?? '';
    const model = this.config.get<string>('ai.model') || 'gemma-4-31b-it';
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || '';
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
}
