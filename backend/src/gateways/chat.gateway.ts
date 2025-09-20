import { UseGuards, Logger } from '@nestjs/common';
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
import { MessagesService } from 'src/services/messages.service';
import { RoomsService } from 'src/services/rooms.service';

interface ChatMessagePayload {
  message: string;
  roomId: string;
}

interface JoinRoomPayload {
  roomId: string;
}

@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly roomsService: RoomsService,
    private readonly messagesService: MessagesService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Chat Gateway Initialized!');
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

    const previousMessages = await this.messagesService.getMessage(roomId);
    client.emit('previousMessages', previousMessages);
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('chatMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatMessagePayload,
  ) {
    const { roomId, message } = payload;
    const user = client.data.user;

    this.logger.log(
      `Received message from client ${client.id} in room ${roomId}: ${message}`,
    );

    if (!client.rooms.has(roomId)) {
      this.logger.warn(
        `User ${user.id} tried to send message to room ${roomId} without joining.`,
      );
      return;
    }

    const newMessage = await this.messagesService.createMessage(
      user.id,
      roomId,
      message,
    );

    this.server.to(roomId).emit('chatMessage', {
      sender: {
        id: user.id,
        username: user.username,
      },
      message: newMessage.text,
      createdAt: newMessage.createdAt,
    });
  }
}
