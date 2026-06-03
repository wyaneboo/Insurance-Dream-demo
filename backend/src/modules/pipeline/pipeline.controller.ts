import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../shared/roles.decorator';
import { RolesGuard } from '../shared/roles.guard';
import { CreatePipelineCaseDto, UpdatePipelineCaseDto } from './dto/pipeline.dto';
import { PipelineService } from './pipeline.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('AGENT', 'ADMIN')
@Controller('pipeline')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get()
  list(@Req() req: any) {
    return this.pipelineService.list(req.user.userId, req.user.role);
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: any) {
    return this.pipelineService.get(id, req.user.userId, req.user.role);
  }

  @Post()
  create(@Body() dto: CreatePipelineCaseDto, @Req() req: any) {
    return this.pipelineService.create(dto, req.user.userId, req.user.role);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePipelineCaseDto, @Req() req: any) {
    return this.pipelineService.update(id, dto, req.user.userId, req.user.role);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.pipelineService.delete(id, req.user.userId, req.user.role);
  }
}
