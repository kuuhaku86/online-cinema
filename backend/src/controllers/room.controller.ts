import {
  Controller,
  Post,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoomService } from '../services/room.service';
import { Room } from '../entities/room.entity';
import { User } from '../entities/user.entity';
import { Request } from 'express';

interface RequestWithAuthenticatedUser extends Request {
  user: Pick<User, 'id'>;
}

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: RequestWithAuthenticatedUser,
  ): Promise<Room> {
    const currentUser = req.user;
    return this.roomService.createRoom(currentUser.id);
  }
}