import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
};

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() dto: CreateProjectDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.projectsService.create(dto, request.user);
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.projectsService.update(
      id,
      dto,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.projectsService.remove(id, request.user);
  }
}