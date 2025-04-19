import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../services/users.service';

interface JwtPayload {
  sub: string;
  username: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? '',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    console.log('JwtStrategy: Validating JWT payload:', payload);

    if (!payload || !payload.sub) {
      console.error('JwtStrategy: Invalid payload received.');
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return payload;
  }
}
