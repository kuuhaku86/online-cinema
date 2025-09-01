import {
  Controller,
  Post,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Param,
  Body,
  Get,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoomsService } from '../services/rooms.service';
import { Room } from '../entities/room.entity';
import { User } from '../entities/user.entity';
import { Request } from 'express';
import { StartRoomDto } from 'src/dto/rooms/start-room.dto';
import { Message } from 'src/entities/message.entity';
import { MessagesService } from 'src/services/messages.service';

interface RequestWithAuthenticatedUser extends Request {
  user: Pick<User, 'id'>;
}

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly messagesService: MessagesService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: RequestWithAuthenticatedUser): Promise<Room> {
    const currentUser = req.user;
    return this.roomsService.createRoom(currentUser.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':roomCode/join')
  @HttpCode(HttpStatus.OK)
  async join(
    @Param('roomCode') roomCode: string,
    @Req() req: RequestWithAuthenticatedUser,
  ): Promise<Room> {
    const userId = req.user.id;
    return this.roomsService.joinRoom(roomCode, userId);
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
    return this.roomsService.startRoom(roomCode, startRoomDto.videoId, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':roomCode/messages')
  @HttpCode(HttpStatus.OK)
  async messages(
    @Param('roomCode') roomCode: string,
    @Req() req: RequestWithAuthenticatedUser,
  ): Promise<Message[]> {
    const hasAccess = await this.roomsService.checkUserAccessToRoom(
      roomCode,
      req.user.id,
    );

    if (!hasAccess) {
      throw new NotFoundException('Video not found or access denied.');
    }

    return this.messagesService.getMessage(roomCode);
  }
}
