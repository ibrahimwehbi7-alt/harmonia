import { IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCampaignDraftDto {
  @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @IsString() @MinLength(1) @MaxLength(180) subject!: string;
  @IsString() @MinLength(1) @MaxLength(20000) body!: string;
  @IsString() @IsIn(['ALL_SUBSCRIBERS','EVENT_UPDATES','VOLUNTEER_UPDATES','PARTNER_UPDATES','INTEREST']) audienceType!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) interestFilters?: string[];
}
