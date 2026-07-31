import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProjectDto): Promise<Project> {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        ownerId: dto.ownerId,
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
      throw new NotFoundException(`Project with ID "${id}" was not found.`);
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    await this.findOne(id);

    const data: Prisma.ProjectUpdateInput = {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      status: dto.status,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    };

    if (dto.ownerId !== undefined) {
      data.owner = dto.ownerId
        ? { connect: { id: dto.ownerId } }
        : { disconnect: true };
    }

    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Project> {
    await this.findOne(id);

    return this.prisma.project.delete({
      where: { id },
    });
  }
}
