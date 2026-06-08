import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IsObject, IsString } from 'class-validator';
import { AiService } from './ai.service';
import { InternalSecretGuard } from './internal-secret.guard';
import { AgentAction } from './tools/types';

class InternalToolDto {
  @IsString()
  role!: string;

  @IsString()
  userId!: string;

  // Free-form CRUD action planned by the agent; validated/normalized in the service.
  @IsObject()
  action!: AgentAction;
}

/**
 * Internal-only endpoint the Python ai-service calls to run CRM CRUD on the
 * agent's behalf. Not exposed to end users (guarded by a shared secret rather
 * than the JWT user guard).
 */
@Controller('internal/ai')
@UseGuards(InternalSecretGuard)
export class AiInternalController {
  constructor(private readonly aiService: AiService) {}

  @Post('tool')
  tool(@Body() dto: InternalToolDto) {
    return this.aiService.executeTool(dto.role, dto.userId, dto.action);
  }
}
