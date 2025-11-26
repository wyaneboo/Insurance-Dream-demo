import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  list(@Req() req: any) {
    return this.policiesService.listForUser(req.user.userId, req.user.role);
  }

  @Get(':id')
  detail(@Param('id') id: string, @Req() req: any) {
    return this.policiesService.detail(id, req.user.userId, req.user.role);
  }
}
