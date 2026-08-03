import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrganizationRole,
  Prisma,
  UserRole,
} from '@prisma/client';
import { existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

import { PrismaService } from '../prisma/prisma.service';
import { FileQueryDto } from './dto/file-query.dto';

type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};

const fileInclude = {
  organization: true,
  project: true,
  uploadedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
};

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    file: Express.Multer.File,
    organizationId: string,
    projectId: string | undefined,
    user: AuthenticatedUser,
  ) {
    await this.assertCanManage(organizationId, user);
    await this.assertProject(projectId, organizationId);

    return this.prisma.fileAsset.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: '',
        organizationId,
        projectId,
        uploadedById: user.userId,
      },
      include: fileInclude,
    });
  }

  async findAll(query: FileQueryDto, user: AuthenticatedUser) {
    const allowedOrganizationIds = await this.allowedOrganizationIds(user);

    if (
      query.organizationId &&
      !this.isGlobalAdmin(user) &&
      !allowedOrganizationIds.includes(query.organizationId)
    ) {
      throw new ForbiddenException('You cannot access this organization');
    }

    const where: Prisma.FileAssetWhereInput = {
      organizationId:
        query.organizationId ??
        (this.isGlobalAdmin(user)
          ? undefined
          : { in: allowedOrganizationIds }),
      projectId: query.projectId,
      mimeType: query.mimeType
        ? { contains: query.mimeType, mode: 'insensitive' }
        : undefined,
      ...(query.search
        ? {
            OR: [
              {
                originalName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                mimeType: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.fileAsset.findMany({
        where,
        include: fileInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.fileAsset.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const asset = await this.prisma.fileAsset.findUnique({
      where: { id },
      include: fileInclude,
    });

    if (!asset) {
      throw new NotFoundException('File not found');
    }

    await this.assertMember(asset.organizationId, user);
    return asset;
  }

  async findForDownload(id: string, user: AuthenticatedUser) {
    const asset = await this.findOne(id, user);
    const path = this.getLocalPath(asset.filename);

    if (!existsSync(path)) {
      throw new NotFoundException(
        'The file record exists, but the stored file is unavailable',
      );
    }

    return asset;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const asset = await this.findOne(id, user);
    await this.assertCanManage(asset.organizationId, user);

    const path = this.getLocalPath(asset.filename);

    const deleted = await this.prisma.fileAsset.delete({
      where: { id },
    });

    if (existsSync(path)) {
      await unlink(path);
    }

    return deleted;
  }

  getLocalPath(filename: string): string {
    return join(process.cwd(), 'uploads', filename);
  }

  private isGlobalAdmin(user: AuthenticatedUser): boolean {
    return (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN
    );
  }

  private async allowedOrganizationIds(
    user: AuthenticatedUser,
  ): Promise<string[]> {
    if (this.isGlobalAdmin(user)) {
      return [];
    }

    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId: user.userId },
      select: { organizationId: true },
    });

    return memberships.map((membership) => membership.organizationId);
  }

  private async assertMember(
    organizationId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (this.isGlobalAdmin(user)) {
      return;
    }

    const membership = await this.prisma.organizationMember.findUnique({
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

  private async assertCanManage(
    organizationId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    await this.assertMember(organizationId, user);

    if (this.isGlobalAdmin(user)) {
      return;
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.userId,
          organizationId,
        },
      },
    });

    if (
      membership?.role !== OrganizationRole.OWNER &&
      membership?.role !== OrganizationRole.ADMIN &&
      membership?.role !== OrganizationRole.MODERATOR
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage files',
      );
    }
  }

  private async assertProject(
    projectId: string | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!projectId) {
      return;
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.organizationId !== organizationId) {
      throw new BadRequestException(
        'Project and file must belong to the same organization',
      );
    }
  }
}
