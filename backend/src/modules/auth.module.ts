import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthService } from '../services/auth.service';
import { UsersModule } from './users.module';
import { LocalStrategy } from '../auth/strategies/local.strategy';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { AuthController } from '../controllers/auth.controller';
import { JwtRefreshStrategy } from '../auth/strategies/jwt-refresh.strategy';

@Module({
  imports: [
    forwardRef(() => UsersModule), // Use forwardRef for UsersModule
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
