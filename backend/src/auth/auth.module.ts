import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { AccessResolverService } from './access-resolver.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET is not configured');
        return { secret, signOptions: { expiresIn: '1h' } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessResolverService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtModule, PassportModule, JwtAuthGuard],
})
export class AuthModule {}
