import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: this.sanitizeUser(user),
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: this.sanitizeUser(user),
    };
  }

  private sanitizeUser<T extends { password: string }>(user: T) {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }
}