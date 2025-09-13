import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = client.handshake.auth.token as string;

    if (!token) {
      throw new UnauthorizedException('Authentication token not found.');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      client.data.user = payload;
      client.data.user.id = payload.sub;

      return true;
    } catch (e) {
      console.error('Token validation failed:', e);
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
