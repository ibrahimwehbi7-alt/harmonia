import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddDepartmentMemberDto, ApplyWorkforceDto, CreateAssignmentDto, CreateDepartmentDto, CreateInvitationDto, CreateSkillDto, LogHoursDto, RespondAssignmentDto, ReviewApplicationDto, UpdateMySkillsDto } from './dto/workforce.dto';
import { WorkforceService } from './workforce.service';

@Controller('workforce')
@UseGuards(JwtAuthGuard)
export class WorkforceController {
  constructor(private readonly workforce: WorkforceService) {}
  @Get('me') dashboard(@Request() req: any) { return this.workforce.dashboard(req.user); }
  @Get('departments') departments(@Request() req: any, @Query('organizationId') organizationId: string) { return this.workforce.listDepartments(req.user, organizationId); }
  @Post('departments') createDepartment(@Request() req: any, @Body() dto: CreateDepartmentDto) { return this.workforce.createDepartment(req.user, dto); }
  @Post('departments/:id/members') addMember(@Request() req: any, @Param('id') id: string, @Body() dto: AddDepartmentMemberDto) { return this.workforce.addDepartmentMember(req.user, id, dto); }
  @Get('skills') skills(@Request() req: any, @Query('organizationId') organizationId: string) { return this.workforce.listSkills(req.user, organizationId); }
  @Post('skills') createSkill(@Request() req: any, @Body() dto: CreateSkillDto) { return this.workforce.createSkill(req.user, dto); }
  @Patch('me/skills') updateSkills(@Request() req: any, @Body() dto: UpdateMySkillsDto) { return this.workforce.updateMySkills(req.user, dto); }
  @Post('applications') apply(@Request() req: any, @Body() dto: ApplyWorkforceDto) { return this.workforce.apply(req.user, dto); }
  @Get('applications') applications(@Request() req: any, @Query('organizationId') organizationId: string) { return this.workforce.applications(req.user, organizationId); }
  @Patch('applications/:id') review(@Request() req: any, @Param('id') id: string, @Body() dto: ReviewApplicationDto) { return this.workforce.review(req.user, id, dto); }
  @Post('invitations') createInvitation(@Request() req: any, @Body() dto: CreateInvitationDto) { return this.workforce.createInvitation(req.user, dto); }
  @Get('invitations') invitations(@Request() req: any, @Query('organizationId') organizationId: string) { return this.workforce.invitations(req.user, organizationId); }
  @Post('assignments') createAssignment(@Request() req: any, @Body() dto: CreateAssignmentDto) { return this.workforce.createAssignment(req.user, dto); }
  @Get('assignments') assignments(@Request() req: any, @Query('organizationId') organizationId?: string) { return this.workforce.assignments(req.user, organizationId); }
  @Patch('assignments/:id/respond') respond(@Request() req: any, @Param('id') id: string, @Body() dto: RespondAssignmentDto) { return this.workforce.respond(req.user, id, dto.status); }
  @Post('hours') logHours(@Request() req: any, @Body() dto: LogHoursDto) { return this.workforce.logHours(req.user, dto); }
  @Get('hours') hours(@Request() req: any, @Query('userId') userId?: string) { return this.workforce.hours(req.user, userId); }
}
