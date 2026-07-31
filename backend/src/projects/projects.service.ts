import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Project, UserRole } from '@prisma/client';

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

  create(
    dto: CreateProjectDto,
    user: AuthenticatedUser,
  ): Promise<Project> {
    return this.prisma.project.create({
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        ownerId: user.userId,
      },
    });
  }

  findAll(): Promise<Project[]> {
    return this.prisma.project.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
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

    this.assertCanManage(project, user);

    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        startDate:
          dto.startDate === undefined
            ? undefined
            : new Date(dto.startDate),
        endDate:
          dto.endDate === undefined
            ? undefined
            : new Date(dto.endDate),
      },
    });
  }

  async remove(
    id: string,
    user: AuthenticatedUser,
  ): Promise<Project> {
    const project = await this.findOne(id);

    this.assertCanManage(project, user);

    return this.prisma.project.delete({
      where: { id },
    });
  }

  private assertCanManage(
    project: Project,
    user: AuthenticatedUser,
  ): void {
    const isOwner = project.ownerId === user.userId;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to manage this project',
      );
    }
  }
}