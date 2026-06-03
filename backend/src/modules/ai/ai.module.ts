import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ProspectsModule } from '../prospects/prospects.module';
import { PipelineModule } from '../pipeline/pipeline.module';

@Module({
  imports: [ProspectsModule, PipelineModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
