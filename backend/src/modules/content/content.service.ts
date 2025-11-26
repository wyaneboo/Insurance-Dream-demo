import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  listTrainings() {
    return this.prisma.training.findMany({ orderBy: { publishDate: 'desc' } });
  }

  listNews() {
    return this.prisma.newsCircular.findMany({ orderBy: { publishDate: 'desc' } });
  }
}
