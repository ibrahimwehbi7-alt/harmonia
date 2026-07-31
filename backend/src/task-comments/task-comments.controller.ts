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
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';
import { TaskCommentsService } from './task-comments.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
};

@UseGuards(JwtAuthGuard)
@Controller()
export class TaskCommentsController {
  constructor(
    private readonly taskCommentsService: TaskCommentsService,
  ) {}

  @Post('tasks/:taskId/comments')
  create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateTaskCommentDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.taskCommentsService.create(
      taskId,
      dto,
      request.user,
    );
  }

  @Get('tasks/:taskId/comments')
  findByTask(
    @Param('taskId') taskId: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.taskCommentsService.findByTask(
      taskId,
      request.user,
    );
  }

  @Patch('task-comments/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskCommentDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.taskCommentsService.update(
      id,
      dto,
      request.user,
    );
  }

  @Delete('task-comments/:id')
  remove(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.taskCommentsService.remove(
      id,
      request.user,
    );
  }
}