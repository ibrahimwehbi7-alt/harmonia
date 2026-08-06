import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { EntityType } from '@prisma/client';

export class CreateActivityEntryDto {
  @IsString()
  organizationId!: string;

  @IsEnum(EntityType)
  entityType!: EntityType;

  @IsString()
  entityId!: string;

  @IsString()
  @MaxLength(100)
  action!: string;

  @IsString()
  @MaxLength(500)
  summary!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
