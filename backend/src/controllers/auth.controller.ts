import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CreateUserDto } from '../dto/users/create-user.dto';
import { UsersService } from '../services/users.service';

interface RequestWithUser extends Request {
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface RequestWithRefreshTokenPayload extends Request {
  user: {
    id: string;
    refreshToken: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    console.log('Registration attempt with body:', createUserDto);
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: RequestWithUser) {
    console.log(`Login successful for user: ${req.user.username}`);
    return this.authService.login(req.user);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: RequestWithRefreshTokenPayload) {
    const userId = req.user.id;
    const refreshToken = req.user.refreshToken;
    console.log(`Token refresh requested for user ID: ${userId}`);
    return this.authService.refreshToken(userId, refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    console.log(`Logout requested for user ID: ${userId}`);
    await this.authService.logout(userId);
    return {
      message: `Logout successful for user ${userId}. Implement logout logic in AuthService.`,
    };
  }
}
