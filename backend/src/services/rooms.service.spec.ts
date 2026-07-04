import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { RoomsService } from './rooms.service';
import { Room } from '../entities/room.entity';
import { Video } from '../entities/video.entity';
import { RedisHelper } from 'src/helpers/redis.helper';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <T extends ObjectLiteral>(): MockRepository<T> => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockRedisHelper = {
  set: jest.fn(),
  get: jest.fn(),
};

describe('RoomsService', () => {
  let service: RoomsService;
  let roomRepository: MockRepository<Room>;
  let videoRepository: MockRepository<Video>;

  const mockUserId = 'user-uuid';
  const mockRoom: Room = {
    id: 'room-uuid',
    shortCode: 'abc123',
    ownerId: mockUserId,
    userIds: [mockUserId],
    active: false,
    videoId: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [],
  };

  const mockVideo: Video = {
    id: 'video-uuid',
    fileName: 'test.mp4',
    userId: mockUserId,
    user: null as any,
    ready: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset mockRoom to default state (it may be mutated by service methods)
    mockRoom.active = false;
    mockRoom.videoId = null as any;
    mockRoom.userIds = [mockUserId];
    mockVideo.ready = true;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: getRepositoryToken(Room), useValue: createMockRepository() },
        {
          provide: getRepositoryToken(Video),
          useValue: createMockRepository(),
        },
        { provide: RedisHelper, useValue: mockRedisHelper },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    roomRepository = module.get<MockRepository<Room>>(getRepositoryToken(Room));
    videoRepository = module.get<MockRepository<Video>>(
      getRepositoryToken(Video),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRoom', () => {
    it('should create a room with a shortCode and return it', async () => {
      roomRepository.create!.mockReturnValue(mockRoom);
      roomRepository.save!.mockResolvedValue(mockRoom);

      const result = await service.createRoom(mockUserId);

      expect(roomRepository.create).toHaveBeenCalledWith({
        userIds: [mockUserId],
        ownerId: mockUserId,
        shortCode: expect.any(String),
      });
      expect(roomRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockRoom);
    });
  });

  describe('joinRoom', () => {
    it('should add a user to the room and return it', async () => {
      const roomWithoutUser = { ...mockRoom, active: true, userIds: ['other-user'] };
      roomRepository.findOne!.mockResolvedValue(roomWithoutUser);
      roomRepository.save!.mockResolvedValue({
        ...roomWithoutUser,
        userIds: ['other-user', mockUserId],
      });

      const result = await service.joinRoom('abc123', mockUserId);

      expect(roomRepository.findOne).toHaveBeenCalledWith({
        where: { shortCode: 'abc123' },
      });
      expect(result.userIds).toContain(mockUserId);
    });

    it('should return the room unchanged if user is already in it', async () => {
      const activeRoom = { ...mockRoom, active: true };
      roomRepository.findOne!.mockResolvedValue(activeRoom);

      const result = await service.joinRoom('abc123', mockUserId);

      expect(result).toEqual(activeRoom);
      expect(roomRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if room does not exist', async () => {
      roomRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.joinRoom('nonexistent', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if room is not active', async () => {
      roomRepository.findOne!.mockResolvedValue({
        ...mockRoom,
        active: false,
      });

      await expect(
        service.joinRoom('abc123', mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('startRoom', () => {
    it('should activate the room with a video', async () => {
      roomRepository.findOne!.mockResolvedValue(mockRoom);
      videoRepository.findOne!.mockResolvedValue(mockVideo);
      roomRepository.save!.mockResolvedValue({
        ...mockRoom,
        active: true,
        videoId: mockVideo.id,
      });

      const result = await service.startRoom(
        mockRoom.id,
        mockVideo.id,
        mockUserId,
      );

      expect(result.active).toBe(true);
      expect(result.videoId).toBe(mockVideo.id);
    });

    it('should throw NotFoundException if room not found', async () => {
      roomRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.startRoom('bad-room', mockVideo.id, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if room already active', async () => {
      roomRepository.findOne!.mockResolvedValue({
        ...mockRoom,
        active: true,
      });

      await expect(
        service.startRoom(mockRoom.id, mockVideo.id, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if video not found', async () => {
      roomRepository.findOne!.mockResolvedValue(mockRoom);
      videoRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.startRoom(mockRoom.id, 'bad-video', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if video is not ready', async () => {
      roomRepository.findOne!.mockResolvedValue(mockRoom);
      videoRepository.findOne!.mockResolvedValue({
        ...mockVideo,
        ready: false,
      });

      await expect(
        service.startRoom(mockRoom.id, mockVideo.id, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkUserAccessToRoomAndVideo', () => {
    it('should return true if user is in the room', async () => {
      roomRepository.findOneBy!.mockResolvedValue(mockRoom);

      const result = await service.checkUserAccessToRoomAndVideo(
        mockRoom.id,
        mockVideo.id,
        mockUserId,
      );

      expect(result).toBe(true);
    });

    it('should throw NotFoundException if room/video combo not found', async () => {
      roomRepository.findOneBy!.mockResolvedValue(null);

      await expect(
        service.checkUserAccessToRoomAndVideo(
          'bad-room',
          'bad-video',
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return false if user is not in room', async () => {
      roomRepository.findOneBy!.mockResolvedValue({
        ...mockRoom,
        userIds: ['other-user'],
      });

      const result = await service.checkUserAccessToRoomAndVideo(
        mockRoom.id,
        mockVideo.id,
        'unknown-user',
      );

      expect(result).toBe(false);
    });
  });

  describe('checkUserAccessToRoom', () => {
    it('should return true if user is in the room', async () => {
      roomRepository.findOneBy!.mockResolvedValue(mockRoom);

      const result = await service.checkUserAccessToRoom(
        mockRoom.id,
        mockUserId,
      );

      expect(result).toBe(true);
    });

    it('should throw NotFoundException if room not found', async () => {
      roomRepository.findOneBy!.mockResolvedValue(null);

      await expect(
        service.checkUserAccessToRoom('bad-room', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRoomStatus', () => {
    it('should set room status in Redis', async () => {
      await service.updateRoomStatus(mockRoom.id, '00:05', true);

      expect(mockRedisHelper.set).toHaveBeenCalledWith(mockRoom.id, {
        time: '00:05',
        play: true,
      });
    });
  });

  describe('getRoomStatus', () => {
    it('should get room status from Redis', async () => {
      const mockStatus = { time: '00:05', play: true };
      mockRedisHelper.get.mockResolvedValue(mockStatus);

      const result = await service.getRoomStatus(mockRoom.id);

      expect(mockRedisHelper.get).toHaveBeenCalledWith(mockRoom.id);
      expect(result).toEqual(mockStatus);
    });
  });
});
