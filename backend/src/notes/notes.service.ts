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

import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteQueryDto } from './dto/note-query.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};

const noteInclude = {
  organization: true,
  project: true,
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
};

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNoteDto, user: AuthenticatedUser) {
    await this.assertMember(dto.organizationId, user);
    await this.assertProject(dto.projectId, dto.organizationId);

    return this.prisma.note.create({
      data: {
        title: dto.title.trim(),
        content: dto.content,
        category: dto.category?.trim() || 'general',
        pinned: dto.pinned ?? false,
        tags: dto.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
        organizationId: dto.organizationId,
        projectId: dto.projectId,
        authorId: user.userId,
      },
      include: noteInclude,
    });
  }

  async findAll(query: NoteQueryDto, user: AuthenticatedUser) {
    const allowedOrganizationIds = await this.allowedOrganizationIds(user);

    if (
      query.organizationId &&
      !this.isGlobalAdmin(user) &&
      !allowedOrganizationIds.includes(query.organizationId)
    ) {
      throw new ForbiddenException('You cannot access this organization');
    }

    const where: Prisma.NoteWhereInput = {
      organizationId:
        query.organizationId ??
        (this.isGlobalAdmin(user)
          ? undefined
          : { in: allowedOrganizationIds }),
      projectId: query.projectId,
      category: query.category,
      pinned: query.pinned,
      ...(query.search
        ? {
            OR: [
              {
                title: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                content: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                tags: {
                  has: query.search,
                },
              },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.note.findMany({
        where,
        include: noteInclude,
        orderBy: [
          { pinned: 'desc' },
          { updatedAt: 'desc' },
        ],
        skip,
        take: query.limit,
      }),
      this.prisma.note.count({ where }),
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
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: noteInclude,
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    await this.assertMember(note.organizationId, user);
    return note;
  }

  async update(
    id: string,
    dto: UpdateNoteDto,
    user: AuthenticatedUser,
  ) {
    const current = await this.findOne(id, user);
    const organizationId = dto.organizationId ?? current.organizationId;

    await this.assertCanManage(organizationId, user);
    await this.assertProject(dto.projectId, organizationId);

    return this.prisma.note.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        content: dto.content,
        category: dto.category?.trim(),
        pinned: dto.pinned,
        tags: dto.tags?.map((tag) => tag.trim()).filter(Boolean),
        organizationId: dto.organizationId,
        projectId: dto.projectId,
      },
      include: noteInclude,
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const note = await this.findOne(id, user);
    await this.assertCanManage(note.organizationId, user);

    return this.prisma.note.delete({
      where: { id },
    });
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
        'You do not have permission to manage notes',
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
        'Project and note must belong to the same organization',
      );
    }
  }
}
