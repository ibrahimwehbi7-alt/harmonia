import { EventAttendanceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class AddEventContactDto {
  @IsString()
  contactId!: string;

  @IsOptional()
  @IsEnum(EventAttendanceStatus)
  status?: EventAttendanceStatus;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
