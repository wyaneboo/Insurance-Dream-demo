import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  list(@Req() req: any) {
    return this.tasksService.list(req.user.userId);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Req() req: any) {
    return this.tasksService.complete(id, req.user.userId);
  }
}
