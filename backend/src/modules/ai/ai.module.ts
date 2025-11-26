import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [AiController],
  providers: [AiService, ConfigService],
  exports: [AiService],
})
export class AiModule {}
