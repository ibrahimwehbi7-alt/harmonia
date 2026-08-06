import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

export type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            id: true,
            role: true,
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();

    if (data.firstName === '' || data.lastName === '') {
      throw new BadRequestException('First and last name cannot be empty');
    }

    await this.prisma.user.update({ where: { id: userId }, data });
    return this.getProfile(userId);
  }

  async listUsers(actor: AuthenticatedUser, search = '') {
    this.assertGlobalAdmin(actor);
    const q = search.trim();
    return this.prisma.user.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        memberships: {
          select: {
            role: true,
            organization: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 250,
    });
  }

  async updateRole(
    actor: AuthenticatedUser,
    userId: string,
    role: UserRole,
  ) {
    this.assertGlobalAdmin(actor);

    const target = await this.findById(userId);
    if (!target) throw new NotFoundException('User not found');

    if (actor.userId === userId && role === UserRole.VIEWER) {
      throw new BadRequestException('You cannot remove your own administrative access');
    }

    if (role === UserRole.SUPER_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a super administrator can grant that role');
    }

    if (target.role === UserRole.SUPER_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a super administrator can modify that user');
    }

    await this.prisma.user.update({ where: { id: userId }, data: { role } });
    return this.getProfile(userId);
  }

  private assertGlobalAdmin(actor: AuthenticatedUser) {
    if (
  !([UserRole.ADMIN, UserRole.SUPER_ADMIN] as UserRole[]).includes(actor.role)
) {
      throw new ForbiddenException('Administrator access is required');
    }
  }
}
