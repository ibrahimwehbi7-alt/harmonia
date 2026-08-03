import { IsOptional, IsString, MaxLength } from 'class-validator';
export class LinkContactProjectDto {
  @IsString() projectId!: string;
  @IsOptional() @IsString() @MaxLength(200) role?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
