import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateDepartmentDto { @IsString() organizationId!: string; @IsString() name!: string; @IsOptional() @IsString() description?: string; }
export class AddDepartmentMemberDto { @IsString() userId!: string; @IsOptional() @IsString() level?: string; }
export class CreateSkillDto { @IsString() organizationId!: string; @IsString() name!: string; @IsOptional() @IsString() category?: string; }
export class UpdateMySkillsDto { @IsArray() skills!: Array<{ skillId: string; proficiency: number; isInterested?: boolean }>; }
export class ApplyWorkforceDto { @IsString() organizationId!: string; @IsString() type!: string; @IsOptional() @IsString() motivation?: string; @IsOptional() @IsString() inviteCode?: string; }
export class ReviewApplicationDto { @IsString() status!: string; @IsOptional() @IsString() reviewNotes?: string; @IsOptional() @IsString() departmentId?: string; }
export class CreateInvitationDto { @IsString() organizationId!: string; @IsString() memberType!: string; @IsOptional() @IsString() departmentId?: string; @IsOptional() @IsInt() @Min(1) maxUses?: number; }
export class CreateAssignmentDto { @IsString() organizationId!: string; @IsString() userId!: string; @IsString() title!: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsString() departmentId?: string; @IsOptional() @IsString() startsAt?: string; @IsOptional() @IsString() endsAt?: string; @IsOptional() @IsNumber() estimatedHours?: number; }
export class RespondAssignmentDto { @IsString() status!: string; }
export class LogHoursDto { @IsString() date!: string; @IsNumber() @Min(0.25) @Max(24) hours!: number; @IsOptional() @IsString() assignmentId?: string; @IsOptional() @IsString() note?: string; }
