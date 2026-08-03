import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExternalOrganizationDto } from './dto/create-external-organization.dto';
import { UpdateExternalOrganizationDto } from './dto/update-external-organization.dto';
import { ExternalOrganizationsService } from './external-organizations.service';
type AuthenticatedRequest = { user: { userId: string; email: string; role: UserRole } };
@UseGuards(JwtAuthGuard)
@Controller('external-organizations')
export class ExternalOrganizationsController {
  constructor(private readonly service: ExternalOrganizationsService) {}
  @Post() create(@Body() dto: CreateExternalOrganizationDto, @Request() req: AuthenticatedRequest) { return this.service.create(dto, req.user); }
  @Get() findAll(@Query('organizationId') organizationId: string, @Query('search') search: string | undefined, @Request() req: AuthenticatedRequest) { return this.service.findAll(organizationId, search, req.user); }
  @Get(':id') findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) { return this.service.findOne(id, req.user); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateExternalOrganizationDto, @Request() req: AuthenticatedRequest) { return this.service.update(id, dto, req.user); }
  @Delete(':id') remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) { return this.service.remove(id, req.user); }
}
