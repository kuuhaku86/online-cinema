import { UseGuards, Logger, Inject, forwardRef } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from 'src/auth/guards/ws-auth.guard';
import { RoomsService } from 'src/services/rooms.service';

interface RoomStatusPayload {
  roomId: string;
  time: string;
  play: boolean;
}

interface JoinRoomPayload {
  roomId: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class RoomGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomGateway.name);

  constructor(private readonly roomsService: RoomsService) {}

  afterInit(server: Server) {
    this.logger.log('Room Gateway Initialized!');
  }

  @UseGuards(WsAuthGuard)
  handleConnection(client: Socket) {
    this.logger.log(`Client authenticated and connected: ${client.id}`);
    this.logger.log(`User payload: ${JSON.stringify(client.data)}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    const { roomId } = payload;
    const userId = client.data.user.id;

    const hasAccess = await this.roomsService.checkUserAccessToRoom(
      roomId,
      userId,
    );
    if (!hasAccess) {
      this.logger.warn(`User ${userId} denied access to room ${roomId}`);
      client.emit('error', { message: 'Access to room denied.' });
      return;
    }

    await client.join(roomId);
    this.logger.log(
      `Client ${client.id} (user: ${userId}) joined room ${roomId}`,
    );

    const previousRoomStatus = await this.roomsService.getRoomStatus(roomId);
    client.emit('previousRoomStatus', previousRoomStatus);
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('updateRoomStatus')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: RoomStatusPayload,
  ) {
    const { roomId, time, play } = payload;
    const user = client.data.user;

    this.logger.log(
      `Received update from client ${client.id} in room ${roomId}: ${time} , ${play}`,
    );

    if (!client.rooms.has(roomId)) {
      this.logger.warn(
        `User ${user.id} tried to send message to room ${roomId} without joining.`,
      );
      return;
    }

    const newMessage = await this.roomsService.updateRoomStatus(
      roomId,
      time,
      play,
    );

    this.server.to(roomId).emit('roomStatus', {
      time,
      play,
    });
  }
}
