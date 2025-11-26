import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.taskReminder.findMany({ where: { userId }, orderBy: { dueAt: 'asc' } });
  }

  complete(id: string, userId: string) {
    return this.prisma.taskReminder.updateMany({
      where: { id, userId },
      data: { status: 'completed' },
    });
  }
}
