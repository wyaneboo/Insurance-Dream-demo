import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../shared/roles.guard';
import { Roles } from '../shared/roles.decorator';
import { CreateServiceRequestDto, UpdateServiceRequestDto } from './dto/services.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  list(@Req() req: any) {
    return this.servicesService.list(req.user.userId);
  }

  @Post()
  create(@Body() dto: CreateServiceRequestDto, @Req() req: any) {
    return this.servicesService.create(dto, req.user.userId);
  }

  @Patch(':id/status')
  @Roles('AGENT', 'ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateServiceRequestDto) {
    return this.servicesService.updateStatus(id, dto);
  }
}
