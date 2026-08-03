import { ContactCategory, ContactStatus, RelationshipStrength } from '@prisma/client';
import { IsArray, IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateContactDto {
  @IsString() @MaxLength(100) firstName!: string;
  @IsString() @MaxLength(100) lastName!: string;
  @IsOptional() @IsString() @MaxLength(200) displayName?: string;
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(50) phone?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) website?: string;
  @IsOptional() @IsString() @MaxLength(250) location?: string;
  @IsOptional() @IsString() @MaxLength(5000) notes?: string;
  @IsOptional() @IsString() @MaxLength(250) source?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsEnum(ContactCategory) category?: ContactCategory;
  @IsOptional() @IsEnum(ContactStatus) status?: ContactStatus;
  @IsOptional() @IsEnum(RelationshipStrength) relationshipStrength?: RelationshipStrength;
  @IsOptional() @IsDateString() lastContactedAt?: string;
  @IsOptional() @IsDateString() nextFollowUpAt?: string;
  @IsString() organizationId!: string;
  @IsOptional() @IsString() externalOrganizationId?: string;
}
