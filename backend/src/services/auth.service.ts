import { ForbiddenException, Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';

interface AccessTokenPayload {
  sub: string;
  username: string;
  email: string;
}

interface RefreshTokenPayload {
  sub: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<
    Omit<User, 'passwordHash'>,
    'currentHashedRefreshToken'
  > | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, currentHashedRefreshToken, ...result } = user;
      return result;
    }
    return null;
  }

  async login(
    user: Omit<User, 'passwordHash' | 'currentHashedRefreshToken'>,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const accessTokenPayload: AccessTokenPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };
    const refreshTokenPayload: RefreshTokenPayload = { sub: user.id };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION,
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRATION,
      }),
    ]);

    await this.updateRefreshTokenHash(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.currentHashedRefreshToken) {
      throw new ForbiddenException('Access Denied: No active refresh token.');
    }

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.currentHashedRefreshToken,
    );

    if (!isRefreshTokenMatching) {
      throw new ForbiddenException('Access Denied: Invalid refresh token.');
    }

    const accessTokenPayload: AccessTokenPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };
    const refreshTokenPayload: RefreshTokenPayload = { sub: user.id };

    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION,
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRATION,
      }),
    ]);

    await this.updateRefreshTokenHash(user.id, newRefreshToken);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(
    userId: string,
  ): Promise<Omit<User, 'passwordHash' | 'currentHashedRefreshToken'> | null> {
    const user = await this.usersService.removeRefreshToken(userId);
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, currentHashedRefreshToken, ...result } = user;
      return result;
    }
    return null;
  }

  private async updateRefreshTokenHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.setCurrentRefreshToken(userId, hashedRefreshToken);
  }
}
