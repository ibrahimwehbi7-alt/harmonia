import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OrganizationRole, UserRole } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

export type WorkspaceKind = 'ADMIN' | 'TEAM' | 'MEMBER';

export type ResolvedAccess = {
  workspace: WorkspaceKind;
  effectiveRole: UserRole;
  globalRole: UserRole;
  membershipRole: OrganizationRole | null;
  organizationId: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isTeamMember: boolean;
};

@Injectable()
export class AccessResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(userId: string) {
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

    if (!user) throw new UnauthorizedException('User no longer exists');

    const membershipRank: Record<OrganizationRole, number> = {
      [OrganizationRole.MEMBER]: 0,
      [OrganizationRole.MODERATOR]: 1,
      [OrganizationRole.ADMIN]: 2,
      [OrganizationRole.OWNER]: 3,
    };

    const primaryMembership = [...user.memberships].sort(
      (a, b) => membershipRank[b.role] - membershipRank[a.role],
    )[0] ?? null;

    const membershipRole = primaryMembership?.role ?? null;
    const ownerMembership = membershipRole === OrganizationRole.OWNER;
    const adminMembership =
      membershipRole === OrganizationRole.OWNER ||
      membershipRole === OrganizationRole.ADMIN;
    const moderatorMembership = membershipRole === OrganizationRole.MODERATOR;

    let workspace: WorkspaceKind = 'MEMBER';
    let effectiveRole: UserRole = UserRole.VIEWER;

    if (user.role === UserRole.SUPER_ADMIN) {
      workspace = 'ADMIN';
      effectiveRole = UserRole.SUPER_ADMIN;
    } else if (user.role === UserRole.ADMIN) {
      workspace = 'ADMIN';
      effectiveRole = UserRole.ADMIN;
    } else if (ownerMembership) {
      // Compatibility bridge: existing owner-only services currently key off
      // SUPER_ADMIN. The stored global User.role is NOT modified.
      workspace = 'ADMIN';
      effectiveRole = UserRole.SUPER_ADMIN;
    } else if (adminMembership) {
      workspace = 'ADMIN';
      effectiveRole = UserRole.ADMIN;
    } else if (user.role === UserRole.TEAM_MEMBER || moderatorMembership) {
      workspace = 'TEAM';
      effectiveRole = UserRole.TEAM_MEMBER;
    }

    const access: ResolvedAccess = {
      workspace,
      effectiveRole,
      globalRole: user.role,
      membershipRole,
      organizationId: primaryMembership?.organization.id ?? null,
      organizationName: primaryMembership?.organization.name ?? null,
      organizationSlug: primaryMembership?.organization.slug ?? null,
      isOwner: user.role === UserRole.SUPER_ADMIN || ownerMembership,
      isAdmin:
        user.role === UserRole.SUPER_ADMIN ||
        user.role === UserRole.ADMIN ||
        adminMembership,
      isTeamMember:
        workspace === 'ADMIN' || workspace === 'TEAM',
    };

    return {
      ...user,
      // `role` remains backward-compatible for the existing backend/frontend
      // permission checks. The database value remains available as globalRole.
      role: effectiveRole,
      globalRole: user.role,
      membershipRole,
      access,
    };
  }
}
