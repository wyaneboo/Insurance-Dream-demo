import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClaimDto {
  @IsString()
  @IsNotEmpty()
  policyId!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsOptional()
  @IsArray()
  requiredDocs?: string[];

  @IsOptional()
  @IsArray()
  submittedDocs?: string[];
}

export class UpdateClaimStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
