import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VideosService } from './videos.service';
import { Video } from '../entities/video.entity';
import { RedisHelper } from 'src/helpers/redis.helper';
import { AuthService } from './auth.service';

jest.mock('fluent-ffmpeg', () => {
  const mockOn = jest.fn().mockReturnThis();
  const mockRun = jest.fn();
  return jest.fn(() => ({
    outputOptions: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: mockOn,
    run: mockRun,
  }));
});

describe('VideosService', () => {
  let service: VideosService;

  const mockUserId = 'user-uuid';
  const mockVideoId = 'video-uuid';
  const mockRoomId = 'room-uuid';

  const mockVideo: Video = {
    id: mockVideoId,
    fileName: 'test-video.mp4',
    userId: mockUserId,
    ready: false,
    user: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    size: 1024 * 1024,
    destination: '/tmp',
    filename: 'random-name.mp4',
    path: '/tmp/random-name.mp4',
    buffer: Buffer.from(''),
    stream: null as any,
  };

  let videoRepo: any;
  let redisHelper: any;
  let authService: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    videoRepo = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    redisHelper = { set: jest.fn(), get: jest.fn() };
    authService = { generateStreamToken: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        { provide: getRepositoryToken(Video), useValue: videoRepo },
        { provide: RedisHelper, useValue: redisHelper },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVideos', () => {
    it('should return videos for a user', async () => {
      videoRepo.find.mockResolvedValue([mockVideo]);

      const result = await service.getVideos(mockUserId);

      expect(videoRepo.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(result).toEqual([mockVideo]);
    });

    it('should return empty array when user has no videos', async () => {
      videoRepo.find.mockResolvedValue([]);

      const result = await service.getVideos(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('handleUpload', () => {
    it('should save video and return success response', async () => {
      videoRepo.create.mockReturnValue(mockVideo);
      videoRepo.save.mockResolvedValue(mockVideo);

      const result = await service.handleUpload(mockFile, mockUserId);

      expect(videoRepo.create).toHaveBeenCalledWith({
        userId: mockUserId,
        fileName: mockFile.filename,
      });
      expect(videoRepo.save).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Video uploaded successfully',
        id: mockVideo.id,
      });
    });

    it('should throw BadRequestException for unsupported file type', async () => {
      const badFile = { ...mockFile, mimetype: 'image/png' };

      await expect(
        service.handleUpload(badFile, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for file exceeding max size', async () => {
      const largeFile = { ...mockFile, size: 600 * 1024 * 1024 };

      await expect(
        service.handleUpload(largeFile, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getVideoStatus', () => {
    it('should return video status from Redis when video exists', async () => {
      videoRepo.findOneBy.mockResolvedValue(mockVideo);
      const status = {
        status: 'completed',
        processedPath: '/uploads/test.m3u8',
      };
      redisHelper.get.mockResolvedValue(status);

      const result = await service.getVideoStatus(mockVideoId, mockUserId);

      expect(videoRepo.findOneBy).toHaveBeenCalledWith({
        id: mockVideoId,
        userId: mockUserId,
      });
      expect(result).toEqual(status);
    });

    it('should return undefined when video is not found', async () => {
      videoRepo.findOneBy.mockResolvedValue(null);

      const result = await service.getVideoStatus('bad-id', mockUserId);

      expect(result).toBeUndefined();
    });
  });

  describe('getStreamDetail', () => {
    it('should return stream detail with token and URL', async () => {
      videoRepo.findOneBy.mockResolvedValue(mockVideo);
      authService.generateStreamToken.mockResolvedValue('stream-token-123');

      const result = await service.getStreamDetail(
        mockUserId,
        mockRoomId,
        mockVideoId,
      );

      expect(authService.generateStreamToken).toHaveBeenCalledWith(
        mockUserId,
        mockRoomId,
        mockVideoId,
      );
      expect(result).toBeDefined();
      expect(result!.urlStream).toContain('stream-token-123');
      expect(result!.urlStream).toContain(mockRoomId);
      expect(result!.urlStream).toContain(mockVideoId);
      expect(result!.urlStream).toContain('master.m3u8');
    });

    it('should return undefined when video is not found', async () => {
      videoRepo.findOneBy.mockResolvedValue(null);

      const result = await service.getStreamDetail(
        mockUserId,
        mockRoomId,
        'bad-video',
      );

      expect(result).toBeUndefined();
    });
  });
});
