import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomsService } from '../services/rooms.service';
import { MessagesService } from '../services/messages.service';
import { AuthGuard } from '@nestjs/passport';
import { NotFoundException } from '@nestjs/common';
import { Room } from '../entities/room.entity';

const mockRoomsService = {
  createRoom: jest.fn(),
  joinRoom: jest.fn(),
  startRoom: jest.fn(),
  checkUserAccessToRoom: jest.fn(),
};

const mockMessagesService = {
  getMessage: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn(() => true),
};

describe('RoomsController', () => {
  let controller: RoomsController;
  let roomsService: typeof mockRoomsService;
  let messagesService: typeof mockMessagesService;

  const mockUser = { id: 'user-uuid' };
  const mockRequest = { user: mockUser } as any;
  const mockRoom: Room = {
    id: 'room-uuid',
    shortCode: 'abc123',
    ownerId: mockUser.id,
    userIds: [mockUser.id],
    active: false,
    videoId: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        { provide: RoomsService, useValue: mockRoomsService },
        { provide: MessagesService, useValue: mockMessagesService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<RoomsController>(RoomsController);
    roomsService = module.get(RoomsService);
    messagesService = module.get(MessagesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a room and return it with status 201', async () => {
      roomsService.createRoom.mockResolvedValue(mockRoom);

      const result = await controller.create(mockRequest);

      expect(roomsService.createRoom).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockRoom);
    });

    it('should propagate NotFoundException from service', async () => {
      roomsService.createRoom.mockRejectedValue(new NotFoundException());

      await expect(controller.create(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('join', () => {
    it('should join a room by shortCode', async () => {
      const joinedRoom = { ...mockRoom, userIds: [mockUser.id, 'other-user'] };
      roomsService.joinRoom.mockResolvedValue(joinedRoom);

      const result = await controller.join('abc123', mockRequest);

      expect(roomsService.joinRoom).toHaveBeenCalledWith(
        'abc123',
        mockUser.id,
      );
      expect(result).toEqual(joinedRoom);
    });

    it('should propagate NotFoundException when room not found', async () => {
      roomsService.joinRoom.mockRejectedValue(new NotFoundException());

      await expect(
        controller.join('badcode', mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('start', () => {
    it('should start a room with a video', async () => {
      const startedRoom = {
        ...mockRoom,
        active: true,
        videoId: 'video-uuid' as any,
      };
      roomsService.startRoom.mockResolvedValue(startedRoom);

      const result = await controller.start(
        'room-uuid',
        { videoId: 'video-uuid' },
        mockRequest,
      );

      expect(roomsService.startRoom).toHaveBeenCalledWith(
        'room-uuid',
        'video-uuid',
        mockUser.id,
      );
      expect(result).toEqual(startedRoom);
    });
  });

  describe('messages', () => {
    it('should return messages for a room with access', async () => {
      roomsService.checkUserAccessToRoom.mockResolvedValue(true);
      const mockMessages = [
        {
          id: 'msg-1',
          text: 'hello',
          userId: mockUser.id,
          roomId: 'room-uuid',
          user: null as any,
          room: null as any,
          createdAt: new Date(),
        },
      ];
      messagesService.getMessage.mockResolvedValue(mockMessages);

      const result = await controller.messages('room-uuid', mockRequest);

      expect(roomsService.checkUserAccessToRoom).toHaveBeenCalledWith(
        'room-uuid',
        mockUser.id,
      );
      expect(result).toEqual(mockMessages);
    });

    it('should throw NotFoundException if user has no access', async () => {
      roomsService.checkUserAccessToRoom.mockResolvedValue(false);

      await expect(
        controller.messages('room-uuid', mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
