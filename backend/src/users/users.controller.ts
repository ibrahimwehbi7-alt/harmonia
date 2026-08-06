import {
  Body,
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
