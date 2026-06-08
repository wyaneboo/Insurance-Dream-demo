import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiInternalController } from './ai.internal.controller';
import { AiService } from './ai.service';
import { InternalSecretGuard } from './internal-secret.guard';
import { PipelineTool } from './tools/pipeline.tool';
import { ProspectTool } from './tools/prospect.tool';
import { ProspectsModule } from '../prospects/prospects.module';
import { PipelineModule } from '../pipeline/pipeline.module';

@Module({
  imports: [ProspectsModule, PipelineModule],
  controllers: [AiController, AiInternalController],
  providers: [AiService, InternalSecretGuard, ProspectTool, PipelineTool],
  exports: [AiService],
})
export class AiModule {}
