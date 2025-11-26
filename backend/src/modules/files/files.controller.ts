import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { FilesService } from './files.service';
import { AuthGuard } from '@nestjs/passport';
import { IsMimeType, IsNotEmpty, IsString } from 'class-validator';

class PresignDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsMimeType()
  contentType!: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('presign-upload')
  presignUpload(@Body() dto: PresignDto) {
    return this.filesService.presignUpload(dto.filename, dto.contentType);
  }

  @Post('presign-download')
  presignDownload(@Body('key') key: string) {
    return this.filesService.presignDownload(key);
  }
}
