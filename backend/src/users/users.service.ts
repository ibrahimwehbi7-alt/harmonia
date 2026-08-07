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

  async getAvailability(userId: string) {
    const profile = await this.prisma.availabilityProfile.findUnique({
      where: { userId },
      include: { weekly: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] }, exceptions: { orderBy: { date: 'asc' } } },
    });
    return profile || {
      userId, timeZone: 'America/Chicago', preferredHoursPerWeek: 0,
      commitmentLevel: 'CASUAL', schedulingNotes: '', isOpenToOpportunities: true,
      weekly: [], exceptions: [],
    };
  }

  async updateAvailability(userId: string, dto: any) {
    const weekly = Array.isArray(dto.weekly) ? dto.weekly.map((item: any) => {
      const dayOfWeek = Number(item.dayOfWeek);
      const startTime = String(item.startTime || '');
      const endTime = String(item.endTime || '');
      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || startTime >= endTime) {
        throw new BadRequestException('Invalid weekly availability window');
      }
      return { dayOfWeek, startTime, endTime };
    }).slice(0, 35) : [];
    const exceptions = Array.isArray(dto.exceptions) ? dto.exceptions.map((item: any) => {
      const date = new Date(String(item.date || ''));
      if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid availability exception date');
      return { date, available: Boolean(item.available), startTime: item.startTime ? String(item.startTime) : null, endTime: item.endTime ? String(item.endTime) : null, note: item.note ? String(item.note).slice(0, 250) : null };
    }).slice(0, 100) : [];
    await this.prisma.$transaction(async tx => {
      const profile = await tx.availabilityProfile.upsert({
        where: { userId },
        create: { userId, timeZone: dto.timeZone || 'America/Chicago', preferredHoursPerWeek: Number(dto.preferredHoursPerWeek || 0), commitmentLevel: dto.commitmentLevel || 'CASUAL', schedulingNotes: dto.schedulingNotes?.trim() || null, isOpenToOpportunities: dto.isOpenToOpportunities !== false },
        update: { timeZone: dto.timeZone || 'America/Chicago', preferredHoursPerWeek: Number(dto.preferredHoursPerWeek || 0), commitmentLevel: dto.commitmentLevel || 'CASUAL', schedulingNotes: dto.schedulingNotes?.trim() || null, isOpenToOpportunities: dto.isOpenToOpportunities !== false },
      });
      await tx.weeklyAvailability.deleteMany({ where: { profileId: profile.id } });
      await tx.availabilityException.deleteMany({ where: { profileId: profile.id } });
      if (weekly.length) await tx.weeklyAvailability.createMany({ data: weekly.map((entry: any) => ({ ...entry, profileId: profile.id })) });
      if (exceptions.length) await tx.availabilityException.createMany({ data: exceptions.map((entry: any) => ({ ...entry, profileId: profile.id })) });
    });
    return this.getAvailability(userId);
  }

  async getAvailabilityDirectory(actor: AuthenticatedUser, dayValue?: string, startTime?: string, endTime?: string) {
    this.assertOwner(actor);
    const dayOfWeek = dayValue === undefined || dayValue === '' ? undefined : Number(dayValue);
    const profiles = await this.prisma.availabilityProfile.findMany({
      where: { isOpenToOpportunities: true, ...(dayOfWeek === undefined ? {} : { weekly: { some: { dayOfWeek, ...(startTime ? { startTime: { lte: startTime } } : {}), ...(endTime ? { endTime: { gte: endTime } } : {}) } } }) },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, interests: true } }, weekly: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] }, exceptions: { where: { date: { gte: new Date() } }, orderBy: { date: 'asc' }, take: 10 } },
      orderBy: { updatedAt: 'desc' }, take: 500,
    });
    return profiles;
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
