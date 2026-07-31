import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Organization,
  OrganizationRole,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AddOrganizationMemberDto } from './dto/add-organization-member.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    dto: CreateOrganizationDto,
    user: AuthenticatedUser,
  ): Promise<Organization> {
    return this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        members: {
          create: {
            userId: user.userId,
            role: OrganizationRole.OWNER,
          },
        },
      },
    });
  }

  findAll(): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      include: {
        members: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Organization> {
    const organization =
      await this.prisma.organization.findUnique({
        where: { id },
        include: {
          members: true,
        },
      });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
    user: AuthenticatedUser,
  ): Promise<Organization> {
    await this.findOne(id);
    await this.assertCanManage(id, user);

    return this.prisma.organization.update({
      where: { id },
      data: dto,
    });
  }

  async remove(
    id: string,
    user: AuthenticatedUser,
  ): Promise<Organization> {
    await this.findOne(id);
    await this.assertCanManage(id, user);

    return this.prisma.organization.delete({
      where: { id },
    });
  }

  async addMember(
    organizationId: string,
    dto: AddOrganizationMemberDto,
    user: AuthenticatedUser,
  ) {
    await this.findOne(organizationId);
    await this.assertCanManage(organizationId, user);

    const email = dto.email.trim().toLowerCase();

    const memberUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!memberUser) {
      throw new NotFoundException(
        'No registered user was found with that email',
      );
    }

    const existingMembership =
      await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: memberUser.id,
            organizationId,
          },
        },
      });

    if (existingMembership) {
      throw new BadRequestException(
        'This user is already a member of the organization',
      );
    }

    const role = dto.role ?? OrganizationRole.MEMBER;

    if (role === OrganizationRole.OWNER) {
      throw new BadRequestException(
        'A new member cannot be assigned the OWNER role',
      );
    }

    return this.prisma.organizationMember.create({
      data: {
        userId: memberUser.id,
        organizationId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async findMembers(organizationId: string) {
    await this.findOne(organizationId);

    return this.prisma.organizationMember.findMany({
      where: {
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async removeMember(
    organizationId: string,
    memberUserId: string,
    user: AuthenticatedUser,
  ) {
    await this.findOne(organizationId);
    await this.assertCanManage(organizationId, user);

    const membership =
      await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: memberUserId,
            organizationId,
          },
        },
      });

    if (!membership) {
      throw new NotFoundException(
        'Organization membership not found',
      );
    }

    if (membership.role === OrganizationRole.OWNER) {
      throw new BadRequestException(
        'The organization owner cannot be removed',
      );
    }

    return this.prisma.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId: memberUserId,
          organizationId,
        },
      },
    });
  }

  private async assertCanManage(
    organizationId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN
    ) {
      return;
    }

    const membership =
      await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: user.userId,
            organizationId,
          },
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this organization',
      );
    }

    if (
      membership.role !== OrganizationRole.OWNER &&
      membership.role !== OrganizationRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage this organization',
      );
    }
  }
}