import {
  Body,
  Post,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateCampaignDraftDto } from './dto/create-campaign-draft.dto';
import { AuthenticatedUser, UsersService } from './users.service';

type AuthenticatedRequest = { user: AuthenticatedUser };

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Request() request: AuthenticatedRequest) {
    return this.usersService.getProfile(request.user.userId);
  }

  @Patch('me')
  updateMe(
    @Request() request: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(request.user.userId, dto);
  }

  @Get('audience')
  audience(@Request() request: AuthenticatedRequest, @Query('segment') segment = 'ALL', @Query('search') search = '') {
    return this.usersService.getAudience(request.user, segment, search);
  }

  @Get('audience/preview')
  previewAudience(@Request() request: AuthenticatedRequest, @Query('audienceType') audienceType: string, @Query('interests') interests = '') {
    return this.usersService.previewAudience(request.user, audienceType, interests.split(',').map(v => v.trim()).filter(Boolean));
  }

  @Get('campaign-drafts')
  campaignDrafts(@Request() request: AuthenticatedRequest) {
    return this.usersService.listCampaignDrafts(request.user);
  }

  @Post('campaign-drafts')
  createCampaignDraft(@Request() request: AuthenticatedRequest, @Body() dto: CreateCampaignDraftDto) {
    return this.usersService.createCampaignDraft(request.user, dto);
  }

  @Get()
  list(
    @Request() request: AuthenticatedRequest,
    @Query('search') search = '',
  ) {
    return this.usersService.listUsers(request.user, search);
  }

  @Patch(':id/role')
  updateRole(
    @Request() request: AuthenticatedRequest,
    @Param('id') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(
      request.user,
      userId,
      dto.role as UserRole,
    );
  }
}
