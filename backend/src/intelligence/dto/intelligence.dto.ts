import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateImpactMetricDto {
  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(40) category?: string;
  @IsNumber() value!: number;
  @IsOptional() @IsString() @MaxLength(30) unit?: string;
  @IsOptional() @IsNumber() target?: number;
  @IsOptional() @IsString() @MaxLength(80) periodLabel?: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

export class CreateReadinessCheckDto {
  @IsOptional() @IsString() eventId?: string;
  @IsString() @MaxLength(180) label!: string;
  @IsOptional() @IsString() @MaxLength(40) category?: string;
  @IsOptional() @IsString() @MaxLength(120) ownerName?: string;
  @IsOptional() @IsDateString() dueAt?: string;
}

export class UpdateReadinessCheckDto {
  @IsBoolean() completed!: boolean;
}

export class PlanPromptDto {
  @IsString() @MaxLength(2000) prompt!: string;
}
