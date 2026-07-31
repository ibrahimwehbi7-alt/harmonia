import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Project,
  Task,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';

type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};

type TaskWithProject = Task & {
  project: Project;
};

@Injectable()
export class TaskCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    taskId: string,
    dto: CreateTaskCommentDto,
    user: AuthenticatedUser,
  ) {
    const task = await this.findTask(taskId);

    await this.assertCanViewTask(task, user);

    return this.prisma.taskComment.create({
      data: {
        content: dto.content,
        taskId,
        authorId: user.userId,
      },
      include: {
        author: {
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

    return this.prisma.taskComment.findMany({
      where: {
        taskId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async update(
    id: string,
    dto: UpdateTaskCommentDto,
    user: AuthenticatedUser,
  ) {
    const comment = await this.prisma.taskComment.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.assertCanViewTask(comment.task, user);
    this.assertCanModifyComment(comment.authorId, user);

    return this.prisma.taskComment.update({
      where: { id },
      data: {
        content: dto.content,
      },
      include: {
        author: {
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

  async remove(
    id: string,
    user: AuthenticatedUser,
  ) {
    const comment = await this.prisma.taskComment.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.assertCanViewTask(comment.task, user);
    this.assertCanModifyComment(comment.authorId, user);

    return this.prisma.taskComment.delete({
      where: { id },
    });
  }

  private async findTask(
    taskId: string,
  ): Promise<TaskWithProject> {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
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
      'You do not have permission to access comments on this task',
    );
  }

  private assertCanModifyComment(
    authorId: string,
    user: AuthenticatedUser,
  ): void {
    const isAuthor = authorId === user.userId;

    const isAdministrator =
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN;

    if (!isAuthor && !isAdministrator) {
      throw new ForbiddenException(
        'You do not have permission to modify this comment',
      );
    }
  }
}