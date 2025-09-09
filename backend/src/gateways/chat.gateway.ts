import { UseGuards } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from 'src/auth/guards/ws-auth.guard';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log('Chat Gateway Initialized!');
  }

  @UseGuards(WsAuthGuard)
  handleConnection(client: Socket) {
    console.log(`Client authenticated and connected: ${client.id}`);
    console.log('User payload:', client.data.user);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('chatMessage')
  handleMessage(client: Socket, payload: { message: string }) {
    console.log(
      `Received message from client ${client.id}: ${payload.message}`,
    );

    this.server.emit('chatMessage', {
      sender: {
        id: client.data.user.id,
        username: client.data.user.username,
      },
      message: payload.message,
    });
  }
}
