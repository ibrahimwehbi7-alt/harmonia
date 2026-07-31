import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { extname } from 'node:path';
import { diskStorage } from 'multer';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttachmentsService } from './attachments.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
};

@UseGuards(JwtAuthGuard)
@Controller()
export class AttachmentsController {
  constructor(
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @Post('tasks/:taskId/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (
          _request,
          file,
          callback,
        ) => {
          const extension = extname(
            file.originalname,
          ).toLowerCase();

          callback(
            null,
            `${randomUUID()}${extension}`,
          );
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  create(
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() request: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException(
        'A file is required',
      );
    }

    return this.attachmentsService.create(
      taskId,
      file,
      request.user,
    );
  }

  @Get('tasks/:taskId/attachments')
  findByTask(
    @Param('taskId') taskId: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.attachmentsService.findByTask(
      taskId,
      request.user,
    );
  }

  @Get('attachments/:id/download')
  async download(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const attachment =
      await this.attachmentsService.findForDownload(
        id,
        request.user,
      );

    const filePath =
      this.attachmentsService.getLocalPath(
        attachment.filename,
      );

    response.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition':
        `attachment; filename="${encodeURIComponent(
          attachment.originalName,
        )}"`,
      'Content-Length': attachment.size,
    });

    return new StreamableFile(
      createReadStream(filePath),
    );
  }

  @Delete('attachments/:id')
  remove(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.attachmentsService.remove(
      id,
      request.user,
    );
  }
}