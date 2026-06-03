import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../shared/roles.decorator';
import { RolesGuard } from '../shared/roles.guard';
import { CreateProspectDto, CreateProspectNoteDto, UpdateProspectDto } from './dto/prospects.dto';
import { ProspectsService } from './prospects.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('AGENT', 'ADMIN')
@Controller('prospects')
export class ProspectsController {
  constructor(private readonly prospectsService: ProspectsService) {}

  @Get()
  list(@Req() req: any) {
    return this.prospectsService.list(req.user.userId, req.user.role);
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: any) {
    return this.prospectsService.get(id, req.user.userId, req.user.role);
  }

  @Post()
  create(@Body() dto: CreateProspectDto, @Req() req: any) {
    return this.prospectsService.create(dto, req.user.userId, req.user.role);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProspectDto, @Req() req: any) {
    return this.prospectsService.update(id, dto, req.user.userId, req.user.role);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.prospectsService.delete(id, req.user.userId, req.user.role);
  }

  @Post(':id/notes')
  addNote(@Param('id') id: string, @Body() dto: CreateProspectNoteDto, @Req() req: any) {
    return this.prospectsService.addNote(id, dto, req.user.userId, req.user.role);
  }

  @Delete(':prospectId/notes/:noteId')
  deleteNote(@Param('prospectId') prospectId: string, @Param('noteId') noteId: string, @Req() req: any) {
    return this.prospectsService.deleteNote(prospectId, noteId, req.user.userId, req.user.role);
  }
}
