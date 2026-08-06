import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EntityType,
  OrganizationRole,
  Prisma,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityEntryDto } from './dto/create-activity-entry.dto';
import { CreateEntityRelationshipDto } from './dto/create-entity-relationship.dto';

type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};

@Injectable()
export class EntitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async relationshipList(
    organizationId: string,
    user: AuthenticatedUser,
    entityType?: EntityType,
    entityId?: string,
  ) {
    await this.assertMember(organizationId, user);

    const endpointFilter = entityType && entityId
      ? {
          OR: [
            { fromType: entityType, fromId: entityId },
            { toType: entityType, toId: entityId },
          ],
        }
      : {};

    return this.prisma.entityRelationship.findMany({
      where: {
        organizationId,
        ...endpointFilter,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createRelationship(
    dto: CreateEntityRelationshipDto,
    user: AuthenticatedUser,
  ) {
    await this.assertCanManage(dto.organizationId, user);

    if (dto.fromType === dto.toType && dto.fromId === dto.toId) {
      throw new BadRequestException('An entity cannot be connected to itself');
    }

    const existing = await this.prisma.entityRelationship.findFirst({
      where: {
        organizationId: dto.organizationId,
        OR: [
          {
            fromType: dto.fromType,
            fromId: dto.fromId,
            toType: dto.toType,
            toId: dto.toId,
          },
          {
            fromType: dto.toType,
            fromId: dto.toId,
            toType: dto.fromType,
            toId: dto.fromId,
          },
        ],
      },
    });

    if (existing) {
      throw new BadRequestException('These entities are already connected');
    }

    const relationship = await this.prisma.entityRelationship.create({
      data: {
        organizationId: dto.organizationId,
        fromType: dto.fromType,
        fromId: dto.fromId,
        toType: dto.toType,
        toId: dto.toId,
        label: dto.label.trim(),
        notes: dto.notes?.trim(),
        createdById: user.userId,
      },
    });

    await this.prisma.activityEntry.create({
      data: {
        organizationId: dto.organizationId,
        entityType: dto.fromType,
        entityId: dto.fromId,
        action: 'relationship.created',
        summary: `Connected ${dto.fromType} to ${dto.toType}: ${dto.label}`,
        metadata: { relationshipId: relationship.id } as Prisma.InputJsonValue,
        actorId: user.userId,
      },
    });

    return relationship;
  }

  async removeRelationship(id: string, user: AuthenticatedUser) {
    const relationship = await this.prisma.entityRelationship.findUnique({
      where: { id },
    });

    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }

    await this.assertCanManage(relationship.organizationId, user);

    return this.prisma.entityRelationship.delete({ where: { id } });
  }

  async activityList(
    organizationId: string,
    user: AuthenticatedUser,
    entityType?: EntityType,
    entityId?: string,
    limit = 50,
  ) {
    await this.assertMember(organizationId, user);

    return this.prisma.activityEntry.findMany({
      where: {
        organizationId,
        entityType,
        entityId,
      },
      include: {
        actor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit || 50, 1), 200),
    });
  }

  async createActivity(dto: CreateActivityEntryDto, user: AuthenticatedUser) {
    await this.assertMember(dto.organizationId, user);

    return this.prisma.activityEntry.create({
      data: {
        organizationId: dto.organizationId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        action: dto.action.trim(),
        summary: dto.summary.trim(),
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        actorId: user.userId,
      },
    });
  }

  private isGlobalAdmin(user: AuthenticatedUser) {
    return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
  }

  private async assertMember(organizationId: string, user: AuthenticatedUser) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    if (!organization) throw new NotFoundException('Organization not found');
    if (this.isGlobalAdmin(user)) return;

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: { userId: user.userId, organizationId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }
  }

  private async assertCanManage(organizationId: string, user: AuthenticatedUser) {
    await this.assertMember(organizationId, user);
    if (this.isGlobalAdmin(user)) return;

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: { userId: user.userId, organizationId },
      },
    });

    if (![OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.MODERATOR]
      .includes(membership?.role as OrganizationRole)) {
      throw new ForbiddenException('You cannot manage entity relationships');
    }
  }
}
