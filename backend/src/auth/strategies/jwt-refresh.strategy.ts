import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';

interface RefreshTokenPayload {
  sub: string;
}

export interface UserWithRefreshToken {
  userId: string;
  refreshToken: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      secretOrKey: process.env.JWT_REFRESH_SECRET ?? '',
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  async validate(
    req: Request,
    payload: RefreshTokenPayload,
  ): Promise<UserWithRefreshToken> {
    const refreshToken = req.body?.refresh_token;

    console.log(
      'JwtRefreshStrategy: Validating refresh token payload:',
      payload,
    );

    if (!refreshToken || !payload || !payload.sub) {
      console.error(
        'JwtRefreshStrategy: Missing refresh token or invalid payload.',
      );
      throw new UnauthorizedException('Invalid refresh token or payload');
    }

    return {
      userId: payload.sub,
      refreshToken: refreshToken,
    };
  }
}
