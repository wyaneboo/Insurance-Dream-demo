import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { NewsMonitoringAgent } from './news-monitoring.agent';

@Module({
  controllers: [ContentController],
  providers: [ContentService, NewsMonitoringAgent],
})
export class ContentModule {}
