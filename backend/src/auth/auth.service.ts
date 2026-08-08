import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { AccessResolverService } from './access-resolver.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly accessResolver: AccessResolverService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.usersService.findByEmail(email)) {
      throw new BadRequestException('Email already exists');
    }

    const user = await this.usersService.create({
      email,
      password: await bcrypt.hash(dto.password, 10),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
    });

    return this.issueSession(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueSession(user.id, user.email, user.role);
  }

  async getMe(userId: string) {
    return this.accessResolver.resolve(userId);
  }

  private async issueSession(userId: string, email: string, globalRole: any) {
    const payload: JwtPayload = { sub: userId, email, role: globalRole };
    const user = await this.accessResolver.resolve(userId);
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user,
      access: user.access,
    };
  }
}
