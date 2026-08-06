import {
  Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards,
} from '@nestjs/common';
import { EntityType, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateActivityEntryDto } from './dto/create-activity-entry.dto';
import { CreateEntityRelationshipDto } from './dto/create-entity-relationship.dto';
import { EntitiesService } from './entities.service';

type AuthenticatedRequest = {
  user: { userId: string; email: string; role: UserRole };
};

@UseGuards(JwtAuthGuard)
@Controller('entities')
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Get('relationships')
  relationships(
    @Query('organizationId') organizationId: string,
    @Query('entityType') entityType: EntityType | undefined,
    @Query('entityId') entityId: string | undefined,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.entitiesService.relationshipList(
      organizationId, request.user, entityType, entityId,
    );
  }

  @Post('relationships')
  createRelationship(
    @Body() dto: CreateEntityRelationshipDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.entitiesService.createRelationship(dto, request.user);
  }

  @Delete('relationships/:id')
  removeRelationship(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.entitiesService.removeRelationship(id, request.user);
  }

  @Get('activity')
  activity(
    @Query('organizationId') organizationId: string,
    @Query('entityType') entityType: EntityType | undefined,
    @Query('entityId') entityId: string | undefined,
    @Query('limit') limit: string | undefined,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.entitiesService.activityList(
      organizationId, request.user, entityType, entityId, Number(limit) || 50,
    );
  }

  @Post('activity')
  createActivity(
    @Body() dto: CreateActivityEntryDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.entitiesService.createActivity(dto, request.user);
  }
}
