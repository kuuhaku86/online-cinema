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
  @Post(':roomShortCode/join')
  @HttpCode(HttpStatus.OK)
  async join(
    @Param('roomShortCode') roomShortCode: string,
    @Req() req: RequestWithAuthenticatedUser,
  ): Promise<Room> {
    const userId = req.user.id;
    return this.roomsService.joinRoom(roomShortCode, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':roomId/start')
  @HttpCode(HttpStatus.OK)
  async start(
    @Param('roomId') roomId: string,
    @Body() startRoomDto: StartRoomDto,
    @Req() req: RequestWithAuthenticatedUser,
  ): Promise<Room> {
    const userId = req.user.id;
    return this.roomsService.startRoom(roomId, startRoomDto.videoId, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':roomId/messages')
  @HttpCode(HttpStatus.OK)
  async messages(
    @Param('roomId') roomId: string,
    @Req() req: RequestWithAuthenticatedUser,
  ): Promise<Message[]> {
    const hasAccess = await this.roomsService.checkUserAccessToRoom(
      roomId,
      req.user.id,
    );

    if (!hasAccess) {
      throw new NotFoundException('Video not found or access denied.');
    }

    return this.messagesService.getMessage(roomId);
  }
}
