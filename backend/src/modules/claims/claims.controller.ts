import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateClaimDto, UpdateClaimStatusDto } from './dto/claims.dto';
import { Roles } from '../shared/roles.decorator';
import { RolesGuard } from '../shared/roles.guard';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  list(@Req() req: any) {
    return this.claimsService.list(req.user.userId, req.user.role);
  }

  @Post()
  create(@Body() dto: CreateClaimDto, @Req() req: any) {
    return this.claimsService.create(dto, req.user.userId);
  }

  @Patch(':id/status')
  @Roles('AGENT', 'ADMIN')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateClaimStatusDto, @Req() req: any) {
    return this.claimsService.updateStatus(id, dto, req.user.userId, req.user.role);
  }
}
