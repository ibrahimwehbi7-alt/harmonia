import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

export type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        newsletterOptIn: true,
        newsletterOptInAt: true,
        eventUpdatesOptIn: true,
        volunteerUpdatesOptIn: true,
        partnerUpdatesOptIn: true,
        marketingUnsubscribedAt: true,
        interests: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            id: true,
            role: true,
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.interests !== undefined) {
      data.interests = [...new Set(dto.interests.map(value => value.trim()).filter(Boolean))].slice(0, 12);
    }
    if (dto.newsletterOptIn !== undefined) {
      data.newsletterOptIn = dto.newsletterOptIn;
      data.newsletterOptInAt = dto.newsletterOptIn ? new Date() : null;
      data.marketingUnsubscribedAt = dto.newsletterOptIn ? null : new Date();
    }
    if (dto.eventUpdatesOptIn !== undefined) data.eventUpdatesOptIn = dto.eventUpdatesOptIn;
    if (dto.volunteerUpdatesOptIn !== undefined) data.volunteerUpdatesOptIn = dto.volunteerUpdatesOptIn;
    if (dto.partnerUpdatesOptIn !== undefined) data.partnerUpdatesOptIn = dto.partnerUpdatesOptIn;

    if (data.firstName === '' || data.lastName === '') {
      throw new BadRequestException('First and last name cannot be empty');
    }

    await this.prisma.user.update({ where: { id: userId }, data });
    return this.getProfile(userId);
  }

  async listUsers(actor: AuthenticatedUser, search = '') {
    this.assertGlobalAdmin(actor);
    const q = search.trim();
    return this.prisma.user.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        newsletterOptIn: true,
        interests: true,
        createdAt: true,
        memberships: {
          select: {
            role: true,
            organization: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 250,
    });
  }


  async getAudience(actor: AuthenticatedUser, segment = 'ALL', search = '') {
    this.assertOwner(actor);
    const q = search.trim();
    const where: Prisma.UserWhereInput = {};
    if (q) where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
    ];
    if (segment === 'NEWSLETTER') where.newsletterOptIn = true;
    if (segment === 'EVENTS') where.eventUpdatesOptIn = true;
    if (segment === 'VOLUNTEERS') where.volunteerUpdatesOptIn = true;
    if (segment === 'PARTNERS') where.partnerUpdatesOptIn = true;
    if (segment === 'UNSUBSCRIBED') where.marketingUnsubscribedAt = { not: null };

    const people = await this.prisma.user.findMany({
      where,
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true,
        newsletterOptIn: true, newsletterOptInAt: true,
        eventUpdatesOptIn: true, volunteerUpdatesOptIn: true,
        partnerUpdatesOptIn: true, marketingUnsubscribedAt: true,
        interests: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' }, take: 1000,
    });
    const all = await this.prisma.user.findMany({ select: {
      newsletterOptIn: true, eventUpdatesOptIn: true,
      volunteerUpdatesOptIn: true, partnerUpdatesOptIn: true,
      marketingUnsubscribedAt: true, createdAt: true,
    }});
    const now = new Date();
    return { summary: {
      totalAccounts: all.length,
      newsletterSubscribers: all.filter(p => p.newsletterOptIn).length,
      eventSubscribers: all.filter(p => p.eventUpdatesOptIn).length,
      volunteerSubscribers: all.filter(p => p.volunteerUpdatesOptIn).length,
      unsubscribed: all.filter(p => p.marketingUnsubscribedAt).length,
      newThisMonth: all.filter(p => { const d = new Date(p.createdAt); return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth(); }).length,
    }, people };
  }

  async previewAudience(actor: AuthenticatedUser, audienceType: string, interestFilters: string[] = []) {
    this.assertOwner(actor);
    const where = this.buildAudienceWhere(audienceType, interestFilters);
    return { recipientCount: await this.prisma.user.count({ where }) };
  }

  async createCampaignDraft(actor: AuthenticatedUser, dto: { name: string; subject: string; body: string; audienceType: string; interestFilters?: string[] }) {
    this.assertOwner(actor);
    const interestFilters = [...new Set(dto.interestFilters || [])].slice(0, 12);
    const recipientCount = await this.prisma.user.count({ where: this.buildAudienceWhere(dto.audienceType, interestFilters) });
    return this.prisma.campaignDraft.create({ data: {
      name: dto.name.trim(), subject: dto.subject.trim(), body: dto.body.trim(),
      audienceType: dto.audienceType, interestFilters, recipientCount,
      createdById: actor.userId,
    }});
  }

  async listCampaignDrafts(actor: AuthenticatedUser) {
    this.assertOwner(actor);
    return this.prisma.campaignDraft.findMany({ orderBy: { updatedAt: 'desc' }, take: 100 });
  }

  private buildAudienceWhere(audienceType: string, interests: string[]): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = { marketingUnsubscribedAt: null };
    if (audienceType === 'ALL_SUBSCRIBERS') where.newsletterOptIn = true;
    else if (audienceType === 'EVENT_UPDATES') where.eventUpdatesOptIn = true;
    else if (audienceType === 'VOLUNTEER_UPDATES') where.volunteerUpdatesOptIn = true;
    else if (audienceType === 'PARTNER_UPDATES') where.partnerUpdatesOptIn = true;
    else if (audienceType === 'INTEREST') {
      where.newsletterOptIn = true;
      if (interests.length) where.interests = { hasSome: interests };
    } else throw new BadRequestException('Unknown audience type');
    return where;
  }

  private assertOwner(actor: AuthenticatedUser) {
    if (actor.role !== UserRole.SUPER_ADMIN) throw new ForbiddenException('Owner access is required');
  }

  async updateRole(
    actor: AuthenticatedUser,
    userId: string,
    role: UserRole,
  ) {
    this.assertGlobalAdmin(actor);

    const target = await this.findById(userId);
    if (!target) throw new NotFoundException('User not found');

    if (actor.userId === userId && role === UserRole.VIEWER) {
      throw new BadRequestException('You cannot remove your own administrative access');
    }

    if (role === UserRole.SUPER_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a super administrator can grant that role');
    }

    if (target.role === UserRole.SUPER_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a super administrator can modify that user');
    }

    await this.prisma.user.update({ where: { id: userId }, data: { role } });
    return this.getProfile(userId);
  }

  private assertGlobalAdmin(actor: AuthenticatedUser) {
    if (
  !([UserRole.ADMIN, UserRole.SUPER_ADMIN] as UserRole[]).includes(actor.role)
) {
      throw new ForbiddenException('Administrator access is required');
    }
  }
}
