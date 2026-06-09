import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContentService } from './content.service';
import { Roles } from '../shared/roles.decorator';
import { RolesGuard } from '../shared/roles.guard';

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

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('AGENT', 'ADMIN')
  @Post('news/check-updates')
  checkNewsUpdates() {
    return this.contentService.checkLatestNews();
  }
}
