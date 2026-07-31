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
import { AddOrganizationMemberDto } from './dto/add-organization-member.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
    email: string;
    role: UserRole;
  };
};

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() dto: CreateOrganizationDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.organizationsService.create(dto, request.user);
  }

  @Get()
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.organizationsService.update(id, dto, request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.organizationsService.remove(id, request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/members')
  addMember(
    @Param('id') organizationId: string,
    @Body() dto: AddOrganizationMemberDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.organizationsService.addMember(
      organizationId,
      dto,
      request.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/members')
  findMembers(@Param('id') organizationId: string) {
    return this.organizationsService.findMembers(organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') organizationId: string,
    @Param('userId') memberUserId: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.organizationsService.removeMember(
      organizationId,
      memberUserId,
      request.user,
    );
  }
}