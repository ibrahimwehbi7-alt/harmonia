import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrganizationRole,
  Project,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateProjectDto,
    user: AuthenticatedUser,
  ): Promise<Project> {
    if (dto.organizationId) {
      await this.assertOrganizationMember(
        dto.organizationId,
        user,
      );
    }

    return this.prisma.project.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        status: dto.status,
        startDate: dto.startDate
          ? new Date(dto.startDate)
          : undefined,
        endDate: dto.endDate
          ? new Date(dto.endDate)
          : undefined,
        ownerId: user.userId,
        organizationId: dto.organizationId,
      },
    });
  }

  findAll(): Promise<Project[]> {
    return this.prisma.project.findMany({
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    user: AuthenticatedUser,
  ): Promise<Project> {
    const project = await this.findOne(id);

    await this.assertCanManage(project, user);

    if (
      dto.organizationId !== undefined &&
      dto.organizationId !== project.organizationId
    ) {
      await this.assertOrganizationMember(
        dto.organizationId,
        user,
      );
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        status: dto.status,
        startDate:
          dto.startDate === undefined
            ? undefined
            : new Date(dto.startDate),
        endDate:
          dto.endDate === undefined
            ? undefined
            : new Date(dto.endDate),
        organizationId: dto.organizationId,
      },
    });
  }

  async remove(
    id: string,
    user: AuthenticatedUser,
  ): Promise<Project> {
    const project = await this.findOne(id);

    await this.assertCanManage(project, user);

    return this.prisma.project.delete({
      where: { id },
    });
  }

  private async assertCanManage(
    project: Project,
    user: AuthenticatedUser,
  ): Promise<void> {
    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN
    ) {
      return;
    }

    const isPersonalOwner =
      project.ownerId === user.userId;

    if (!project.organizationId) {
      if (!isPersonalOwner) {
        throw new ForbiddenException(
          'You do not have permission to manage this project',
        );
      }

      return;
    }

    const membership =
      await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: user.userId,
            organizationId: project.organizationId,
          },
        },
      });

    const canManageOrganizationProject =
      membership?.role === OrganizationRole.OWNER ||
      membership?.role === OrganizationRole.ADMIN;

    if (
      !isPersonalOwner &&
      !canManageOrganizationProject
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage this project',
      );
    }
  }

  private async assertOrganizationMember(
    organizationId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const organization =
      await this.prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

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
  }
}