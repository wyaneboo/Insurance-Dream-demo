import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PipelineTool } from './tools/pipeline.tool';
import { ProspectTool } from './tools/prospect.tool';
import { AgentAction, ToolExecution } from './tools/types';

const DEFAULT_AI_SERVICE_URL = 'http://localhost:8000';
const AI_SERVICE_TIMEOUT_MS = 60000;

/**
 * The LangGraph agent now lives in the Python `ai-service`. This service does
 * two things:
 *   1. `chat()` forwards the user message to that service.
 *   2. `executeTool()` dispatches CRM CRUD to the per-resource tool providers,
 *      so all database access and role-based scoping stay here in Node.
 */
@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prospectTool: ProspectTool,
    private readonly pipelineTool: PipelineTool,
  ) {}

  onModuleInit() {
    const serviceUrl = this.config.get<string>('ai.serviceUrl') || DEFAULT_AI_SERVICE_URL;
    this.logger.log(`Dream AI Assistant delegates to the LangGraph service at ${serviceUrl}.`);
  }

  async chat(role: string, userId: string, message: string) {
    const serviceUrl = this.config.get<string>('ai.serviceUrl') || DEFAULT_AI_SERVICE_URL;
    try {
      const response = await fetch(`${serviceUrl}/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role, userId, message }),
        signal: AbortSignal.timeout(AI_SERVICE_TIMEOUT_MS),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`AI service returned ${response.status}${detail ? `: ${detail}` : ''}`);
      }

      const data = (await response.json()) as { reply?: string };
      return { reply: data.reply || 'I could not generate a response.' };
    } catch (error) {
      const description = this.describeError(error);
      this.logger.error(`Dream AI agent failed: ${description}`);
      return { reply: `Dream AI could not complete the request right now. ${description}` };
    }
  }

  /**
   * Executes a single CRM CRUD action requested by the Python agent's tool node.
   * Returns the projected result plus the normalized field set used, so the
   * agent can verify field coverage without duplicating the field vocabulary.
   */
  async executeTool(role: string, userId: string, action: AgentAction): Promise<ToolExecution> {
    if (role !== 'AGENT' && role !== 'ADMIN') {
      return { result: { error: 'CRM CRUD tools are only available to agents/admins.' }, fields: [] };
    }

    if (!action?.resource || !action.operation) {
      return { result: { error: 'I could not identify a CRM CRUD request.' }, fields: [] };
    }

    return action.resource === 'prospect'
      ? this.prospectTool.run(action, userId, role)
      : this.pipelineTool.run(action, userId, role);
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') return 'The AI service timed out.';
      const cause = (error as { cause?: { code?: string } }).cause;
      if (cause?.code === 'ECONNREFUSED') return 'The AI service is not reachable. Is it running?';
      return error.message;
    }
    return String(error || 'Unknown AI error');
  }
}
