import { IsEmail, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
export class CreateExternalOrganizationDto {
  @IsString() @MaxLength(200) name!: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) website?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(50) phone?: string;
  @IsOptional() @IsString() @MaxLength(200) sector?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsString() organizationId!: string;
}
