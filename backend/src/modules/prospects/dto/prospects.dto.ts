import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateProspectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @IsObject()
  contact?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  nextActionAt?: string;
}

export class UpdateProspectDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @IsObject()
  contact?: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  nextActionAt?: string;
}

export class CreateProspectNoteDto {
  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  @IsObject()
  attachments?: Record<string, unknown>;
}
