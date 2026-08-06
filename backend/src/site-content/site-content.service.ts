import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRole, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AuthUser = { userId: string; email: string; role: UserRole };

@Injectable()
export class SiteContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicSite(slug: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });

    if (!organization) throw new NotFoundException('Organization not found');

    const rows = await this.prisma.sitePage.findMany({
      where: { organizationId: organization.id, publishedAt: { not: null } },
      select: {
        key: true,
        data: true,
        publishedAt: true,
        publishedVersion: true,
        updatedAt: true,
      },
    });

    return {
      organization,
      pages: Object.fromEntries(rows.map((row) => [row.key, row])),
    };
  }

  async getPublicEvents(slug: string, limit = 12) {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!organization) throw new NotFoundException('Organization not found');

    const events = await this.prisma.event.findMany({
      where: {
        organizationId: organization.id,
        isPublic: true,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        startAt: { gte: new Date() },
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
        startAt: true,
        endAt: true,
        timezone: true,
        location: true,
        virtualUrl: true,
        registrationUrl: true,
        tags: true,
      },
      orderBy: [{ startAt: 'asc' }, { createdAt: 'asc' }],
      take: Math.min(Math.max(limit || 12, 1), 50),
    });

    return events.map((event) => ({
      ...event,
      featured: event.tags.some(
        (tag) => tag.trim().toLowerCase() === 'featured',
      ),
    }));
  }

  async getOne(orgId: string, key: string, user: AuthUser) {
    await this.assertMember(orgId, user);

    return (
      (await this.prisma.sitePage.findUnique({
        where: { organizationId_key: { organizationId: orgId, key } },
      })) || {
        organizationId: orgId,
        key,
        data: {},
        draftData: null,
        draftUpdatedAt: null,
        publishedAt: null,
        publishedVersion: 0,
      }
    );
  }

  async saveDraft(
    orgId: string,
    key: string,
    data: Record<string, unknown>,
    user: AuthUser,
  ) {
    await this.assertManage(orgId, user);
    const clean = this.cleanKey(key);

    return this.prisma.sitePage.upsert({
      where: { organizationId_key: { organizationId: orgId, key: clean } },
      create: {
        organizationId: orgId,
        key: clean,
        data: {} as Prisma.InputJsonValue,
        draftData: data as Prisma.InputJsonValue,
        draftUpdatedAt: new Date(),
        publishedById: user.userId,
      },
      update: {
        draftData: data as Prisma.InputJsonValue,
        draftUpdatedAt: new Date(),
      },
    });
  }

  async publishDraft(orgId: string, key: string, user: AuthUser) {
    await this.assertManage(orgId, user);
    const clean = this.cleanKey(key);

    const page = await this.prisma.sitePage.findUnique({
      where: { organizationId_key: { organizationId: orgId, key: clean } },
    });

    if (!page?.draftData) {
      throw new NotFoundException('Save a draft before publishing');
    }

    return this.prisma.sitePage.update({
      where: { organizationId_key: { organizationId: orgId, key: clean } },
      data: {
        data: page.draftData,
        publishedById: user.userId,
        publishedAt: new Date(),
        publishedVersion: { increment: 1 },
      },
    });
  }

  // Compatibility route used by Gallery and Partners publishing.
  async publishDirect(
    orgId: string,
    key: string,
    data: Record<string, unknown>,
    user: AuthUser,
  ) {
    await this.assertManage(orgId, user);
    const clean = this.cleanKey(key);

    return this.prisma.sitePage.upsert({
      where: { organizationId_key: { organizationId: orgId, key: clean } },
      create: {
        organizationId: orgId,
        key: clean,
        data: data as Prisma.InputJsonValue,
        draftData: data as Prisma.InputJsonValue,
        draftUpdatedAt: new Date(),
        publishedById: user.userId,
        publishedAt: new Date(),
        publishedVersion: 1,
      },
      update: {
        data: data as Prisma.InputJsonValue,
        draftData: data as Prisma.InputJsonValue,
        draftUpdatedAt: new Date(),
        publishedById: user.userId,
        publishedAt: new Date(),
        publishedVersion: { increment: 1 },
      },
    });
  }

  private cleanKey(key: string) {
    const clean = key.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,60}$/.test(clean)) {
      throw new ForbiddenException('Invalid website content key');
    }
    return clean;
  }

  private async membership(orgId: string, user: AuthUser) {
    return this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.userId,
          organizationId: orgId,
        },
      },
    });
  }

  private global(user: AuthUser) {
    return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
  }

  private async assertMember(orgId: string, user: AuthUser) {
    if (this.global(user)) return;
    if (!(await this.membership(orgId, user))) {
      throw new ForbiddenException('Not a member of this organization');
    }
  }

  private async assertManage(orgId: string, user: AuthUser) {
    if (this.global(user)) return;
    const membership = await this.membership(orgId, user);
    if (
      !membership ||
      !(
        [
          OrganizationRole.OWNER,
          OrganizationRole.ADMIN,
          OrganizationRole.MODERATOR,
        ] as OrganizationRole[]
      ).includes(membership.role)
    ) {
      throw new ForbiddenException('No website publishing permission');
    }
  }
}
