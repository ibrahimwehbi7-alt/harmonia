import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsBoolean()
  newsletterOptIn?: boolean;

  @IsOptional()
  @IsBoolean()
  eventUpdatesOptIn?: boolean;

  @IsOptional()
  @IsBoolean()
  volunteerUpdatesOptIn?: boolean;

  @IsOptional()
  @IsBoolean()
  partnerUpdatesOptIn?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
