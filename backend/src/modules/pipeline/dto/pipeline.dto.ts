import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePipelineCaseDto {
  @IsString()
  @IsNotEmpty()
  applicantName!: string;

  @IsString()
  @IsNotEmpty()
  planName!: string;

  @IsOptional()
  @IsString()
  underwritingStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pendingReasons?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredDocs?: string[];

  @IsOptional()
  @IsDateString()
  submittedAt?: string;

  @IsOptional()
  @IsDateString()
  estimatedIssueDate?: string;

  @IsOptional()
  @IsDateString()
  expiry?: string;

  @IsOptional()
  @IsString()
  policyId?: string;
}

export class UpdatePipelineCaseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  applicantName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  planName?: string;

  @IsOptional()
  @IsString()
  underwritingStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pendingReasons?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredDocs?: string[];

  @IsOptional()
  @IsDateString()
  submittedAt?: string;

  @IsOptional()
  @IsDateString()
  estimatedIssueDate?: string;

  @IsOptional()
  @IsDateString()
  expiry?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  policyId?: string;
}
