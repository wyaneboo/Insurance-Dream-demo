import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';
import { IsNotEmpty, IsString } from 'class-validator';

class AiDto {
  @IsString()
  @IsNotEmpty()
  message!: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('assistant')
  chat(@Body() dto: AiDto, @Req() req: any) {
    return this.aiService.chat(req.user.role, dto.message);
  }
}
