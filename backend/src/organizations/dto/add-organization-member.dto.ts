import { OrganizationRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export class AddOrganizationMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(OrganizationRole)
  role?: OrganizationRole;
}