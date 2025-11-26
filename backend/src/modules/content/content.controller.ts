import { Controller, Get } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('trainings')
  trainings() {
    return this.contentService.listTrainings();
  }

  @Get('news')
  news() {
    return this.contentService.listNews();
  }
}
