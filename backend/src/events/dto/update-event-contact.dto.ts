import { EventAttendanceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateEventContactDto {
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
