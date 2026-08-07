import { IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateAvailabilityDto {
  @IsOptional() @IsString() @MaxLength(80) timeZone?: string;
  @IsOptional() @IsInt() @Min(0) @Max(80) preferredHoursPerWeek?: number;
  @IsOptional() @IsString() @MaxLength(30) commitmentLevel?: string;
  @IsOptional() @IsString() @MaxLength(500) schedulingNotes?: string;
  @IsOptional() @IsBoolean() isOpenToOpportunities?: boolean;
  @IsOptional() @IsArray() @IsObject({ each: true }) weekly?: Array<Record<string, unknown>>;
  @IsOptional() @IsArray() @IsObject({ each: true }) exceptions?: Array<Record<string, unknown>>;
}
