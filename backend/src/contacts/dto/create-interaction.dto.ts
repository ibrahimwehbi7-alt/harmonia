import { InteractionType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
export class CreateInteractionDto {
  @IsEnum(InteractionType) type!: InteractionType;
  @IsOptional() @IsString() @MaxLength(250) subject?: string;
  @IsString() @MaxLength(10000) notes!: string;
  @IsOptional() @IsDateString() occurredAt?: string;
  @IsOptional() @IsDateString() followUpAt?: string;
  @IsOptional() @IsString() projectId?: string;
}
