import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Attachment,
  OrganizationRole,
  Project,
  Task,
  UserRole,
} from '@prisma/client';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

import { PrismaService } from '../prisma/prisma.service';

type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};

type TaskWithProject = Task & {
  project: Project;
};

type AttachmentWithTask = Attachment & {
  task: TaskWithProject;
};

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    taskId: string,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ) {
    const task = await this.findTask(taskId);

    await this.assertCanViewTask(task, user);

    const attachment = await this.prisma.attachment.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: '',
        taskId,
        uploadedById: user.userId,
      },
    });

    return this.prisma.attachment.update({
      where: {
        id: attachment.id,
      },
      data: {
        url: `/attachments/${attachment.id}/download`,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByTask(
    taskId: string,
    user: AuthenticatedUser,
  ) {
    const task = await this.findTask(taskId);

    await this.assertCanViewTask(task, user);

    return this.prisma.attachment.findMany({
      where: {
        taskId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findForDownload(
    id: string,
    user: AuthenticatedUser,
  ): Promise<AttachmentWithTask> {
    const attachment =
      await this.prisma.attachment.findUnique({
        where: {
          id,
        },
        include: {
          task: {
            include: {
              project: true,
            },
          },
        },
      });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    await this.assertCanViewTask(
      attachment.task,
      user,
    );

    return attachment;
  }

  async remove(
    id: string,
    user: AuthenticatedUser,
  ) {
    const attachment =
      await this.prisma.attachment.findUnique({
        where: {
          id,
        },
        include: {
          task: {
            include: {
              project: true,
            },
          },
        },
      });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    await this.assertCanDeleteAttachment(
      attachment,
      user,
    );

    const deleted =
      await this.prisma.attachment.delete({
        where: {
          id,
        },
      });

    const filePath = this.getLocalPath(
      attachment.filename,
    );

    try {
      await unlink(filePath);
    } catch {
      // Ignore missing local files after the database
      // record has already been removed.
    }

    return deleted;
  }

  getLocalPath(filename: string): string {
    return join(
      process.cwd(),
      'uploads',
      filename,
    );
  }

  private async findTask(
    id: string,
  ): Promise<TaskWithProject> {
    const task = await this.prisma.task.findUnique({
      where: {
        id,
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async assertCanViewTask(
    task: TaskWithProject,
    user: AuthenticatedUser,
  ): Promise<void> {
    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN ||
      task.project.ownerId === user.userId ||
      task.assignedToId === user.userId ||
      task.createdById === user.userId
    ) {
      return;
    }

    if (task.project.organizationId) {
      const membership =
        await this.prisma.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId: user.userId,
              organizationId:
                task.project.organizationId,
            },
          },
        });

      if (membership) {
        return;
      }
    }

    throw new ForbiddenException(
      'You do not have permission to access attachments on this task',
    );
  }

  private async assertCanDeleteAttachment(
    attachment: AttachmentWithTask,
    user: AuthenticatedUser,
  ): Promise<void> {
    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN ||
      attachment.uploadedById === user.userId ||
      attachment.task.project.ownerId === user.userId
    ) {
      return;
    }

    const organizationId =
      attachment.task.project.organizationId;

    if (organizationId) {
      const membership =
        await this.prisma.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId: user.userId,
              organizationId,
            },
          },
        });

      const canManage =
        membership?.role === OrganizationRole.OWNER ||
        membership?.role === OrganizationRole.ADMIN ||
        membership?.role === OrganizationRole.MODERATOR;

      if (canManage) {
        return;
      }
    }

    throw new ForbiddenException(
      'You do not have permission to delete this attachment',
    );
  }
}