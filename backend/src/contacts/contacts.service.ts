import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRole, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContactQueryDto } from './dto/contact-query.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { LinkContactProjectDto } from './dto/link-contact-project.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

type User = { userId: string; email: string; role: UserRole };
const include = {
  externalOrganization: true,
  projectLinks: { include: { project: true }, orderBy: { createdAt: 'desc' as const } },
  interactions: { include: { project: true, createdBy: { select: { id: true, firstName: true, lastName: true, email: true } } }, orderBy: { occurredAt: 'desc' as const } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
};

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactDto, user: User) {
    await this.assertMember(dto.organizationId, user);
    await this.assertExternalOrg(dto.externalOrganizationId, dto.organizationId);
    if (dto.email) await this.assertNoDuplicateEmail(dto.organizationId, dto.email);
    return this.prisma.contact.create({ data: {
      ...dto,
      email: dto.email?.trim().toLowerCase(),
      tags: dto.tags?.map(t => t.trim()).filter(Boolean) ?? [],
      lastContactedAt: dto.lastContactedAt ? new Date(dto.lastContactedAt) : undefined,
      nextFollowUpAt: dto.nextFollowUpAt ? new Date(dto.nextFollowUpAt) : undefined,
      createdById: user.userId,
    }, include });
  }

  async findAll(query: ContactQueryDto, user: User) {
    const allowed = await this.allowedOrganizationIds(user);
    if (query.organizationId && !allowed.includes(query.organizationId) && !this.isGlobalAdmin(user)) throw new ForbiddenException('You cannot access this organization');
    const where: Prisma.ContactWhereInput = {
      organizationId: query.organizationId ?? (this.isGlobalAdmin(user) ? undefined : { in: allowed }),
      externalOrganizationId: query.externalOrganizationId,
      category: query.category,
      status: query.status,
      relationshipStrength: query.relationshipStrength,
      ...(query.search ? { OR: [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { displayName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { externalOrganization: { name: { contains: query.search, mode: 'insensitive' } } },
      ] } : {}),
    };
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({ where, include, orderBy: [{ nextFollowUpAt: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }], skip, take: query.limit }),
      this.prisma.contact.count({ where }),
    ]);
    return { items, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
  }

  async findOne(id: string, user: User) {
    const contact = await this.prisma.contact.findUnique({ where: { id }, include });
    if (!contact) throw new NotFoundException('Contact not found');
    await this.assertMember(contact.organizationId, user);
    return contact;
  }

  async update(id: string, dto: UpdateContactDto, user: User) {
    const current = await this.findOne(id, user);
    const organizationId = dto.organizationId ?? current.organizationId;
    await this.assertMember(organizationId, user, true);
    await this.assertExternalOrg(dto.externalOrganizationId, organizationId);
    if (dto.email && dto.email.toLowerCase() !== current.email?.toLowerCase()) await this.assertNoDuplicateEmail(organizationId, dto.email, id);
    return this.prisma.contact.update({ where: { id }, data: {
      ...dto,
      email: dto.email?.trim().toLowerCase(),
      tags: dto.tags?.map(t => t.trim()).filter(Boolean),
      lastContactedAt: dto.lastContactedAt === undefined ? undefined : new Date(dto.lastContactedAt),
      nextFollowUpAt: dto.nextFollowUpAt === undefined ? undefined : new Date(dto.nextFollowUpAt),
    }, include });
  }

  async remove(id: string, user: User) {
    const contact = await this.findOne(id, user);
    await this.assertMember(contact.organizationId, user, true);
    return this.prisma.contact.delete({ where: { id } });
  }

  async addInteraction(contactId: string, dto: CreateInteractionDto, user: User) {
    const contact = await this.findOne(contactId, user);
    await this.assertMember(contact.organizationId, user, true);
    if (dto.projectId) await this.assertProject(dto.projectId, contact.organizationId, user);
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    return this.prisma.$transaction(async tx => {
      const interaction = await tx.contactInteraction.create({ data: {
        type: dto.type, subject: dto.subject, notes: dto.notes, occurredAt,
        followUpAt: dto.followUpAt ? new Date(dto.followUpAt) : undefined,
        contactId, projectId: dto.projectId, createdById: user.userId,
      }, include: { project: true, createdBy: { select: { id: true, firstName: true, lastName: true, email: true } } } });
      await tx.contact.update({ where: { id: contactId }, data: { lastContactedAt: occurredAt, nextFollowUpAt: dto.followUpAt ? new Date(dto.followUpAt) : undefined } });
      return interaction;
    });
  }

  async removeInteraction(contactId: string, interactionId: string, user: User) {
    const contact = await this.findOne(contactId, user);
    await this.assertMember(contact.organizationId, user, true);
    const interaction = await this.prisma.contactInteraction.findFirst({ where: { id: interactionId, contactId } });
    if (!interaction) throw new NotFoundException('Interaction not found');
    return this.prisma.contactInteraction.delete({ where: { id: interactionId } });
  }

  async linkProject(contactId: string, dto: LinkContactProjectDto, user: User) {
    const contact = await this.findOne(contactId, user);
    await this.assertMember(contact.organizationId, user, true);
    await this.assertProject(dto.projectId, contact.organizationId, user);
    try { return await this.prisma.contactProject.create({ data: { contactId, projectId: dto.projectId, role: dto.role, notes: dto.notes }, include: { project: true } }); }
    catch (e) { if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new BadRequestException('Contact is already linked to this project'); throw e; }
  }

  async unlinkProject(contactId: string, projectId: string, user: User) {
    const contact = await this.findOne(contactId, user);
    await this.assertMember(contact.organizationId, user, true);
    const link = await this.prisma.contactProject.findUnique({ where: { contactId_projectId: { contactId, projectId } } });
    if (!link) throw new NotFoundException('Project link not found');
    return this.prisma.contactProject.delete({ where: { contactId_projectId: { contactId, projectId } } });
  }

  private isGlobalAdmin(user: User) { return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN; }
  private async allowedOrganizationIds(user: User) { if (this.isGlobalAdmin(user)) return []; const rows = await this.prisma.organizationMember.findMany({ where: { userId: user.userId }, select: { organizationId: true } }); return rows.map(r => r.organizationId); }
  private async assertMember(organizationId: string, user: User, manage = false) {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organization not found');
    if (this.isGlobalAdmin(user)) return;
    const membership = await this.prisma.organizationMember.findUnique({ where: { userId_organizationId: { userId: user.userId, organizationId } } });
    if (!membership) throw new ForbiddenException('You are not a member of this organization');
    if (manage && membership.role !== OrganizationRole.OWNER && membership.role !== OrganizationRole.ADMIN && membership.role !== OrganizationRole.MODERATOR) throw new ForbiddenException('You do not have permission to manage CRM records');
  }
  private async assertExternalOrg(id: string | undefined, organizationId: string) { if (!id) return; const row = await this.prisma.externalOrganization.findFirst({ where: { id, organizationId } }); if (!row) throw new BadRequestException('External organization does not belong to this workspace'); }
  private async assertNoDuplicateEmail(organizationId: string, email: string, excludeId?: string) { const row = await this.prisma.contact.findFirst({ where: { organizationId, email: email.trim().toLowerCase(), ...(excludeId ? { id: { not: excludeId } } : {}) } }); if (row) throw new BadRequestException('A contact with this email already exists'); }
  private async assertProject(projectId: string, organizationId: string, user: User) { const project = await this.prisma.project.findUnique({ where: { id: projectId } }); if (!project) throw new NotFoundException('Project not found'); if (project.organizationId !== organizationId) throw new BadRequestException('Project and contact must belong to the same organization'); await this.assertMember(organizationId, user); }
}
