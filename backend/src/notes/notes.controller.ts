import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteQueryDto } from './dto/note-query.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(
    @Body() dto: CreateNoteDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.notesService.create(dto, request.user);
  }

  @Get()
  findAll(
    @Query() query: NoteQueryDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.notesService.findAll(query, request.user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.notesService.findOne(id, request.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.notesService.update(id, dto, request.user);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.notesService.remove(id, request.user);
  }
}
