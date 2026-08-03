import { Type } from 'class-transformer';
import { ContactCategory, ContactStatus, RelationshipStrength } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
export class ContactQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() organizationId?: string;
  @IsOptional() @IsString() externalOrganizationId?: string;
  @IsOptional() @IsEnum(ContactCategory) category?: ContactCategory;
  @IsOptional() @IsEnum(ContactStatus) status?: ContactStatus;
  @IsOptional() @IsEnum(RelationshipStrength) relationshipStrength?: RelationshipStrength;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 25;
}
