import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AccessResolverService } from '../access-resolver.service';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly accessResolver: AccessResolverService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) throw new Error('JWT_SECRET is not configured');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const resolved = await this.accessResolver.resolve(payload.sub);
    return {
      userId: resolved.id,
      email: resolved.email,
      role: resolved.role,
      globalRole: resolved.globalRole,
      membershipRole: resolved.membershipRole,
      access: resolved.access,
    };
  }
}
