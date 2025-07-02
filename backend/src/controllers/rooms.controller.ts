import {
  Controller,
  Post,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoomsService } from '../services/rooms.service';
import { Room } from '../entities/room.entity';
import { User } from '../entities/user.entity';
import { Request } from 'express';

interface RequestWithAuthenticatedUser extends Request {
  user: Pick<User, 'id'>;
}

@Controller('rooms')
export class RoomsController {
  constructor(private readonly RoomsService: RoomsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: RequestWithAuthenticatedUser): Promise<Room> {
    const currentUser = req.user;
    return this.RoomsService.createRoom(currentUser.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':roomCode/join')
  @HttpCode(HttpStatus.OK)
  async joinRoom(
    @Param('roomCode') roomCode: string,
    @Req() req: RequestWithAuthenticatedUser,
  ): Promise<Room> {
    const userId = req.user.id;
    return this.RoomsService.joinRoom(roomCode, userId);
  }
}
