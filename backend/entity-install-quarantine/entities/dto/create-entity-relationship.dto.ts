import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EntityType } from '@prisma/client';

export class CreateEntityRelationshipDto {
  @IsString()
  organizationId!: string;

  @IsEnum(EntityType)
  fromType!: EntityType;

  @IsString()
  fromId!: string;

  @IsEnum(EntityType)
  toType!: EntityType;

  @IsString()
  toId!: string;

  @IsString()
  @MaxLength(120)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
