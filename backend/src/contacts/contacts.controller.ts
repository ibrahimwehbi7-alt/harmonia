import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContactQueryDto } from './dto/contact-query.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { LinkContactProjectDto } from './dto/link-contact-project.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactsService } from './contacts.service';

type AuthenticatedRequest = { user: { userId: string; email: string; role: UserRole } };

@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly service: ContactsService) {}
  @Post() create(@Body() dto: CreateContactDto, @Request() req: AuthenticatedRequest) { return this.service.create(dto, req.user); }
  @Get() findAll(@Query() query: ContactQueryDto, @Request() req: AuthenticatedRequest) { return this.service.findAll(query, req.user); }
  @Get(':id') findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) { return this.service.findOne(id, req.user); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateContactDto, @Request() req: AuthenticatedRequest) { return this.service.update(id, dto, req.user); }
  @Delete(':id') remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) { return this.service.remove(id, req.user); }
  @Post(':id/interactions') addInteraction(@Param('id') id: string, @Body() dto: CreateInteractionDto, @Request() req: AuthenticatedRequest) { return this.service.addInteraction(id, dto, req.user); }
  @Delete(':contactId/interactions/:interactionId') removeInteraction(@Param('contactId') contactId: string, @Param('interactionId') interactionId: string, @Request() req: AuthenticatedRequest) { return this.service.removeInteraction(contactId, interactionId, req.user); }
  @Post(':id/projects') linkProject(@Param('id') id: string, @Body() dto: LinkContactProjectDto, @Request() req: AuthenticatedRequest) { return this.service.linkProject(id, dto, req.user); }
  @Delete(':contactId/projects/:projectId') unlinkProject(@Param('contactId') contactId: string, @Param('projectId') projectId: string, @Request() req: AuthenticatedRequest) { return this.service.unlinkProject(contactId, projectId, req.user); }
}
