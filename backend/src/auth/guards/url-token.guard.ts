import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class UrlTokenGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.params.token;

    if (!token) {
      throw new UnauthorizedException(
        'No authentication token found in URL path.',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      request.payload = payload;

      return true;
    } catch (error) {
      throw new UnauthorizedException(
        'Invalid or expired authentication token.',
      );
    }
  }
}
