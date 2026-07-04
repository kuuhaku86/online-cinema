import { Test, TestingModule } from '@nestjs/testing';
import { RoomGateway } from './room.gateway';
import { RoomsService } from 'src/services/rooms.service';

describe('RoomGateway', () => {
  let gateway: RoomGateway;
  let roomsService: any;

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

    roomsService = {
      checkUserAccessToRoom: jest.fn(),
      getRoomStatus: jest.fn(),
      updateRoomStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomGateway,
        { provide: RoomsService, useValue: roomsService },
      ],
    }).compile();

    gateway = module.get<RoomGateway>(RoomGateway);
    gateway.server = {
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    } as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleJoinRoom', () => {
    it('should join room and send previous room status when user has access', async () => {
      roomsService.checkUserAccessToRoom.mockResolvedValue(true);
      const mockStatus = { time: '00:05', play: true };
      roomsService.getRoomStatus.mockResolvedValue(mockStatus);
      const client = createMockSocket();

      await gateway.handleJoinRoom(client, { roomId: mockRoomId });

      expect(roomsService.checkUserAccessToRoom).toHaveBeenCalledWith(
        mockRoomId,
        mockUserId,
      );
      expect(client.join).toHaveBeenCalledWith(mockRoomId);
      expect(client.emit).toHaveBeenCalledWith(
        'previousRoomStatus',
        mockStatus,
      );
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

  describe('handleMessage (updateRoomStatus)', () => {
    it('should update and broadcast room status', async () => {
      const mockStatus = { time: '01:30', play: false };
      roomsService.getRoomStatus
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(mockStatus);
      const client = createMockSocket(new Set([mockRoomId]));
      const roomEmit = jest.fn();
      gateway.server.to = jest.fn().mockReturnValue({ emit: roomEmit });

      await gateway.handleMessage(client, {
        roomId: mockRoomId,
        time: '01:30',
        play: false,
      });

      expect(roomsService.updateRoomStatus).toHaveBeenCalledWith(
        mockRoomId,
        '01:30',
        false,
      );
      expect(gateway.server.to).toHaveBeenCalledWith(mockRoomId);
      expect(roomEmit).toHaveBeenCalledWith('roomStatus', mockStatus);
    });

    it('should ignore update if client has not joined the room', async () => {
      const client = createMockSocket(new Set());

      await gateway.handleMessage(client, {
        roomId: mockRoomId,
        time: '01:30',
        play: false,
      });

      expect(roomsService.updateRoomStatus).not.toHaveBeenCalled();
    });
  });
});
