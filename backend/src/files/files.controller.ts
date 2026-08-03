import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
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
import { FileQueryDto } from './dto/file-query.dto';
import { FilesService } from './files.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_request, file, callback) => {
          callback(
            null,
            `${randomUUID()}${extname(file.originalname).toLowerCase()}`,
          );
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024,
      },
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @Query('organizationId') organizationId: string,
    @Query('projectId') projectId: string | undefined,
    @Request() request: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }

    return this.filesService.create(
      file,
      organizationId,
      projectId,
      request.user,
    );
  }

  @Get()
  findAll(
    @Query() query: FileQueryDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.filesService.findAll(query, request.user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.filesService.findOne(id, request.user);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const asset = await this.filesService.findForDownload(
      id,
      request.user,
    );

    response.set({
      'Content-Type': asset.mimeType,
      'Content-Disposition':
        `attachment; filename="${encodeURIComponent(asset.originalName)}"`,
      'Content-Length': asset.size,
    });

    return new StreamableFile(
      createReadStream(
        this.filesService.getLocalPath(asset.filename),
      ),
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.filesService.remove(id, request.user);
  }
}
