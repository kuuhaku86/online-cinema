import {
  Controller,
  Post,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Param,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoomsService } from '../services/rooms.service';
import { Room } from '../entities/room.entity';
import { User } from '../entities/user.entity';
import { Request } from 'express';
import { StartRoomDto } from 'src/dto/rooms/start-room.dto';

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
  async join(
    @Param('roomCode') roomCode: string,
    @Req() req: RequestWithAuthenticatedUser,
  ): Promise<Room> {
    const userId = req.user.id;
    return this.RoomsService.joinRoom(roomCode, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':roomCode/start')
  @HttpCode(HttpStatus.OK)
  async start(
    @Param('roomCode') roomCode: string,
    @Body() startRoomDto: StartRoomDto,
    @Req() req: RequestWithAuthenticatedUser,
  ): Promise<Room> {
    const userId = req.user.id;
    return this.RoomsService.startRoom(roomCode, startRoomDto.video_id, userId);
  }
}
