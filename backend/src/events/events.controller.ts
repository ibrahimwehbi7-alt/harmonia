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
import { AddEventContactDto } from './dto/add-event-contact.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { UpdateEventContactDto } from './dto/update-event-contact.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(
    @Body() dto: CreateEventDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.eventsService.create(dto, request.user);
  }

  @Get()
  findAll(
    @Query() query: EventQueryDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.eventsService.findAll(query, request.user);
  }

  @Get('upcoming')
  findUpcoming(
    @Query('organizationId') organizationId: string,
    @Query('limit') limit: string | undefined,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.eventsService.findUpcoming(
      organizationId,
      limit ? Number(limit) : 10,
      request.user,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.eventsService.findOne(id, request.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.eventsService.update(id, dto, request.user);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.eventsService.remove(id, request.user);
  }

  @Post(':id/contacts')
  addContact(
    @Param('id') id: string,
    @Body() dto: AddEventContactDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.eventsService.addContact(id, dto, request.user);
  }

  @Patch(':eventId/contacts/:contactId')
  updateContact(
    @Param('eventId') eventId: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateEventContactDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.eventsService.updateContact(
      eventId,
      contactId,
      dto,
      request.user,
    );
  }

  @Delete(':eventId/contacts/:contactId')
  removeContact(
    @Param('eventId') eventId: string,
    @Param('contactId') contactId: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.eventsService.removeContact(
      eventId,
      contactId,
      request.user,
    );
  }
}
