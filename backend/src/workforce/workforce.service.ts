import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AddDepartmentMemberDto, ApplyWorkforceDto, CreateAssignmentDto, CreateDepartmentDto, CreateInvitationDto, CreateSkillDto, LogHoursDto, ReviewApplicationDto, UpdateMySkillsDto } from './dto/workforce.dto';

type Actor = { userId: string; email: string; role: UserRole };

@Injectable()
export class WorkforceService {
  constructor(private readonly prisma: PrismaService) {}
  private admin(actor: Actor) { if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(actor.role as any)) throw new ForbiddenException('Administrator access required'); }
  private owner(actor: Actor) { if (actor.role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Owner access required'); }

  dashboard(actor: Actor) {
    return this.prisma.user.findUnique({ where: { id: actor.userId }, select: {
      id: true, firstName: true, lastName: true, role: true,
      departmentMemberships: { include: { department: true } },
      userSkills: { include: { skill: true }, orderBy: { proficiency: 'desc' } },
      workforceApplications: { orderBy: { createdAt: 'desc' }, take: 5 },
      assignments: { orderBy: { createdAt: 'desc' }, take: 20, include: { department: true } },
      volunteerHours: { orderBy: { date: 'desc' }, take: 20 }
    }});
  }

  listDepartments(actor: Actor, organizationId: string) { return this.prisma.department.findMany({ where: { organizationId }, include: { _count: { select: { members: true, assignments: true } } }, orderBy: { name: 'asc' } }); }
  async createDepartment(actor: Actor, dto: CreateDepartmentDto) { this.admin(actor); return this.prisma.department.create({ data: dto }); }
  async addDepartmentMember(actor: Actor, departmentId: string, dto: AddDepartmentMemberDto) { this.admin(actor); return this.prisma.departmentMembership.upsert({ where: { departmentId_userId: { departmentId, userId: dto.userId } }, update: { level: dto.level || 'MEMBER' }, create: { departmentId, userId: dto.userId, level: dto.level || 'MEMBER' } }); }

  listSkills(actor: Actor, organizationId: string) { return this.prisma.skill.findMany({ where: { organizationId }, orderBy: [{ category: 'asc' }, { name: 'asc' }] }); }
  async createSkill(actor: Actor, dto: CreateSkillDto) { this.admin(actor); return this.prisma.skill.create({ data: dto }); }
  async updateMySkills(actor: Actor, dto: UpdateMySkillsDto) {
    await this.prisma.$transaction(async tx => {
      await tx.userSkill.deleteMany({ where: { userId: actor.userId } });
      if (dto.skills.length) await tx.userSkill.createMany({ data: dto.skills.map(item => ({ userId: actor.userId, skillId: item.skillId, proficiency: Math.max(1, Math.min(5, Number(item.proficiency) || 1)), isInterested: item.isInterested !== false })) });
    });
    return this.dashboard(actor);
  }

  async apply(actor: Actor, dto: ApplyWorkforceDto) {
    let invitation: any = null;
    if (dto.inviteCode) {
      invitation = await this.prisma.invitationCode.findUnique({ where: { code: dto.inviteCode.trim().toUpperCase() } });
      if (!invitation || !invitation.isActive || (invitation.expiresAt && invitation.expiresAt < new Date()) || (invitation.maxUses && invitation.uses >= invitation.maxUses)) throw new BadRequestException('Invitation code is invalid or expired');
      if (invitation.organizationId !== dto.organizationId) throw new BadRequestException('Invitation code belongs to a different organization');
    }
    const application = await this.prisma.workforceApplication.create({ data: { userId: actor.userId, organizationId: dto.organizationId, type: invitation?.memberType || dto.type, motivation: dto.motivation } });
    if (invitation) await this.prisma.invitationCode.update({ where: { id: invitation.id }, data: { uses: { increment: 1 } } });
    return application;
  }

  async applications(actor: Actor, organizationId: string) { this.admin(actor); return this.prisma.workforceApplication.findMany({ where: { organizationId }, include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: 'desc' } }); }
  async review(actor: Actor, id: string, dto: ReviewApplicationDto) {
    this.admin(actor);
    const application = await this.prisma.workforceApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Application not found');
    const status = dto.status.toUpperCase();
    const updated = await this.prisma.workforceApplication.update({ where: { id }, data: { status, reviewNotes: dto.reviewNotes, reviewedById: actor.userId, reviewedAt: new Date() } });
    if (status === 'APPROVED') {
      await this.prisma.user.update({ where: { id: application.userId }, data: { role: UserRole.TEAM_MEMBER } });
      if (dto.departmentId) await this.prisma.departmentMembership.upsert({ where: { departmentId_userId: { departmentId: dto.departmentId, userId: application.userId } }, update: {}, create: { departmentId: dto.departmentId, userId: application.userId } });
    }
    return updated;
  }

  async createInvitation(actor: Actor, dto: CreateInvitationDto) { this.owner(actor); const code = `${dto.memberType.slice(0, 3).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`; return this.prisma.invitationCode.create({ data: { ...dto, code, createdById: actor.userId } }); }
  async invitations(actor: Actor, organizationId: string) { this.owner(actor); return this.prisma.invitationCode.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } }); }

  async createAssignment(actor: Actor, dto: CreateAssignmentDto) { this.admin(actor); return this.prisma.workAssignment.create({ data: { organizationId: dto.organizationId, departmentId: dto.departmentId, userId: dto.userId, title: dto.title, description: dto.description, startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined, endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined, estimatedHours: dto.estimatedHours, createdById: actor.userId } }); }
  async assignments(actor: Actor, organizationId?: string) { const where = actor.role === UserRole.TEAM_MEMBER ? { userId: actor.userId } : organizationId ? { organizationId } : { userId: actor.userId }; return this.prisma.workAssignment.findMany({ where, include: { user: { select: { id: true, firstName: true, lastName: true, email: true } }, department: true }, orderBy: { createdAt: 'desc' } }); }
  async respond(actor: Actor, id: string, status: string) { const assignment = await this.prisma.workAssignment.findUnique({ where: { id } }); if (!assignment) throw new NotFoundException('Assignment not found'); if (assignment.userId !== actor.userId && actor.role !== UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN) throw new ForbiddenException(); const normalized = status.toUpperCase(); if (!['ACCEPTED','DECLINED','IN_PROGRESS','COMPLETED'].includes(normalized)) throw new BadRequestException('Invalid status'); return this.prisma.workAssignment.update({ where: { id }, data: { status: normalized, respondedAt: ['ACCEPTED','DECLINED'].includes(normalized) ? new Date() : undefined, completedAt: normalized === 'COMPLETED' ? new Date() : undefined } }); }

  async logHours(actor: Actor, dto: LogHoursDto) { return this.prisma.volunteerHour.create({ data: { userId: actor.userId, assignmentId: dto.assignmentId, date: new Date(dto.date), hours: dto.hours, note: dto.note } }); }
  async hours(actor: Actor, userId?: string) { if (userId && userId !== actor.userId) this.admin(actor); return this.prisma.volunteerHour.findMany({ where: { userId: userId || actor.userId }, include: { assignment: true }, orderBy: { date: 'desc' } }); }
}
