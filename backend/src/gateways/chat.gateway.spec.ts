import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { RoomsService } from 'src/services/rooms.service';
import { MessagesService } from 'src/services/messages.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let roomsService: any;
  let messagesService: any;

  const mockRoomId = 'room-uuid';
  const mockUserId = 'user-uuid';

  function createMockSocket(rooms: Set<string> = new Set()): any {
    return {
      id: 'socket-id',
      data: { user: { id: mockUserId, username: 'testuser' } },
      rooms,
      join: jest.fn(),
      emit: jest.fn(),
    };
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    roomsService = { checkUserAccessToRoom: jest.fn() };
    messagesService = { createMessage: jest.fn(), getMessage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: RoomsService, useValue: roomsService },
        { provide: MessagesService, useValue: messagesService },
        { provide: JwtService, useValue: { verify: jest.fn() } },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = {
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    } as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleJoinRoom', () => {
    it('should join room and send previous messages when user has access', async () => {
      roomsService.checkUserAccessToRoom.mockResolvedValue(true);
      messagesService.getMessage.mockResolvedValue([]);
      const client = createMockSocket();

      await gateway.handleJoinRoom(client, { roomId: mockRoomId });

      expect(roomsService.checkUserAccessToRoom).toHaveBeenCalledWith(
        mockRoomId,
        mockUserId,
      );
      expect(client.join).toHaveBeenCalledWith(mockRoomId);
      expect(client.emit).toHaveBeenCalledWith('previousMessages', []);
    });

    it('should emit error when user has no access', async () => {
      roomsService.checkUserAccessToRoom.mockResolvedValue(false);
      const client = createMockSocket();

      await gateway.handleJoinRoom(client, { roomId: mockRoomId });

      expect(client.join).not.toHaveBeenCalled();
      expect(client.emit).toHaveBeenCalledWith('error', {
        message: 'Access to room denied.',
      });
    });
  });

  describe('handleMessage', () => {
    it('should broadcast message to room', async () => {
      const mockMessage = {
        id: 'msg-uuid',
        text: 'hello',
        userId: mockUserId,
        roomId: mockRoomId,
        createdAt: new Date(),
      };
      messagesService.createMessage.mockResolvedValue(mockMessage);

      const client = createMockSocket(new Set([mockRoomId]));
      const roomEmit = jest.fn();
      gateway.server.to = jest.fn().mockReturnValue({ emit: roomEmit });

      await gateway.handleMessage(client, {
        roomId: mockRoomId,
        message: 'hello',
      });

      expect(messagesService.createMessage).toHaveBeenCalledWith(
        mockUserId,
        mockRoomId,
        'hello',
      );
      expect(gateway.server.to).toHaveBeenCalledWith(mockRoomId);
      expect(roomEmit).toHaveBeenCalledWith('chatMessage', {
        sender: { id: mockUserId, username: 'testuser' },
        message: 'hello',
        createdAt: mockMessage.createdAt,
      });
    });

    it('should ignore message if client has not joined the room', async () => {
      const client = createMockSocket(new Set());

      await gateway.handleMessage(client, {
        roomId: mockRoomId,
        message: 'hello',
      });

      expect(messagesService.createMessage).not.toHaveBeenCalled();
    });
  });
});
