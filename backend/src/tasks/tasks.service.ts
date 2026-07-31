import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrganizationRole,
  Project,
  Task,
  TaskStatus,
  UserRole,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateTaskDto,
    user: AuthenticatedUser,
  ): Promise<Task> {
    const project = await this.findProject(dto.projectId);

    await this.assertCanManageProject(project, user);

    if (dto.assignedToId) {
      await this.assertValidAssignee(
        project,
        dto.assignedToId,
      );
    }

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate
          ? new Date(dto.dueDate)
          : undefined,
        completedAt:
          dto.status === TaskStatus.DONE
            ? new Date()
            : undefined,
        projectId: dto.projectId,
        assignedToId: dto.assignedToId,
        createdById: user.userId,
      },
      include: {
        project: true,
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
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

  async findAll(user: AuthenticatedUser) {
    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN
    ) {
      return this.prisma.task.findMany({
        include: {
          project: true,
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          createdBy: {
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

    return this.prisma.task.findMany({
      where: {
        OR: [
          {
            project: {
              ownerId: user.userId,
            },
          },
          {
            project: {
              organization: {
                members: {
                  some: {
                    userId: user.userId,
                  },
                },
              },
            },
          },
          {
            assignedToId: user.userId,
          },
          {
            createdById: user.userId,
          },
        ],
      },
      include: {
        project: true,
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
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

  async findOne(
    id: string,
    user: AuthenticatedUser,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.assertCanViewTask(task.project, task, user);

    return task;
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    user: AuthenticatedUser,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.assertCanManageProject(task.project, user);

    if (dto.assignedToId) {
      await this.assertValidAssignee(
        task.project,
        dto.assignedToId,
      );
    }

    let completedAt: Date | null | undefined;

    if (dto.status === TaskStatus.DONE) {
      completedAt = task.completedAt ?? new Date();
    } else if (
      dto.status !== undefined &&
      task.status === TaskStatus.DONE
    ) {
      completedAt = null;
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate:
          dto.dueDate === undefined
            ? undefined
            : new Date(dto.dueDate),
        assignedToId: dto.assignedToId,
        completedAt,
      },
      include: {
        project: true,
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
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
  ): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.assertCanManageProject(task.project, user);

    return this.prisma.task.delete({
      where: { id },
    });
  }

  private async findProject(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async assertCanManageProject(
    project: Project,
    user: AuthenticatedUser,
  ): Promise<void> {
    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN
    ) {
      return;
    }

    if (
      !project.organizationId &&
      project.ownerId === user.userId
    ) {
      return;
    }

    if (project.organizationId) {
      const membership =
        await this.prisma.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId: user.userId,
              organizationId: project.organizationId,
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
      'You do not have permission to manage tasks in this project',
    );
  }

  private async assertCanViewTask(
    project: Project,
    task: Task,
    user: AuthenticatedUser,
  ): Promise<void> {
    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN ||
      project.ownerId === user.userId ||
      task.assignedToId === user.userId ||
      task.createdById === user.userId
    ) {
      return;
    }

    if (project.organizationId) {
      const membership =
        await this.prisma.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId: user.userId,
              organizationId: project.organizationId,
            },
          },
        });

      if (membership) {
        return;
      }
    }

    throw new ForbiddenException(
      'You do not have permission to view this task',
    );
  }

  private async assertValidAssignee(
    project: Project,
    assignedToId: string,
  ): Promise<void> {
    const assignee = await this.prisma.user.findUnique({
      where: {
        id: assignedToId,
      },
    });

    if (!assignee) {
      throw new NotFoundException(
        'Assigned user not found',
      );
    }

    if (!project.organizationId) {
      return;
    }

    const membership =
      await this.prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: assignedToId,
            organizationId: project.organizationId,
          },
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        'Assigned user is not a member of this organization',
      );
    }
  }
}