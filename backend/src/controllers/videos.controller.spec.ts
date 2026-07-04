import { Test, TestingModule } from '@nestjs/testing';
import { VideosController } from './videos.controller';
import { VideosService } from '../services/videos.service';
import { RoomsService } from 'src/services/rooms.service';
import { AuthGuard } from '@nestjs/passport';
import { UrlTokenGuard } from 'src/auth/guards/url-token.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';

const mockVideosService = {
  handleUpload: jest.fn(),
  getVideos: jest.fn(),
  getVideoStatus: jest.fn(),
  getStreamDetail: jest.fn(),
};

const mockRoomsService = {
  checkUserAccessToRoomAndVideo: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockUrlTokenGuard = {
  canActivate: jest.fn(() => true),
};

describe('VideosController', () => {
  let controller: VideosController;
  let videosService: typeof mockVideosService;
  let roomsService: typeof mockRoomsService;

  const mockUser = { id: 'user-uuid' };
  const mockVideoId = 'video-uuid';
  const mockRoomId = 'room-uuid';

  const mockFile: Express.Multer.File = {
    fieldname: 'video',
    originalname: 'test.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    size: 12345,
    destination: './uploads/videos',
    filename: 'random-name.mp4',
    path: './uploads/videos/random-name.mp4',
    buffer: Buffer.from('test'),
    stream: null as any,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [
        { provide: VideosService, useValue: mockVideosService },
        { provide: RoomsService, useValue: mockRoomsService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(UrlTokenGuard)
      .useValue(mockUrlTokenGuard)
      .compile();

    controller = module.get<VideosController>(VideosController);
    videosService = module.get(VideosService);
    roomsService = module.get(RoomsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    it('should call videosService.handleUpload and return its result on successful upload', async () => {
      const mockResponse = {
        message: 'Video uploaded successfully',
        videoUrl: `/uploads/videos/${mockFile.filename}`,
      };
      videosService.handleUpload.mockResolvedValue(mockResponse);

      const mockRequest = { user: mockUser } as any;

      const result = await controller.upload(mockFile, mockRequest);

      expect(videosService.handleUpload).toHaveBeenCalledWith(
        mockFile,
        mockUser.id,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw BadRequestException if no file is provided', async () => {
      const mockRequest = { user: mockUser } as any;

      await expect(
        controller.upload(undefined as any, mockRequest),
      ).rejects.toThrow(new BadRequestException('Video file is required.'));

      expect(videosService.handleUpload).not.toHaveBeenCalled();
    });
  });

  describe('getVideos', () => {
    it('should return list of videos for the authenticated user', async () => {
      const mockVideos = [{ id: mockVideoId, fileName: 'test.mp4' }];
      videosService.getVideos.mockResolvedValue(mockVideos);
      const mockRequest = { user: mockUser } as any;

      const result = await controller.getVideos(mockRequest);

      expect(videosService.getVideos).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockVideos);
    });
  });

  describe('getVideoStatus', () => {
    it('should return video status when video exists', async () => {
      const mockStatus = {
        status: 'completed' as const,
        processedPath: '/path/video.m3u8',
      };
      videosService.getVideoStatus.mockResolvedValue(mockStatus);
      const mockRequest = { user: mockUser } as any;

      const result = await controller.getVideoStatus(
        mockVideoId,
        mockRequest,
      );

      expect(videosService.getVideoStatus).toHaveBeenCalledWith(
        mockVideoId,
        mockUser.id,
      );
      expect(result).toEqual(mockStatus);
    });

    it('should throw NotFoundException when video status is not found', async () => {
      videosService.getVideoStatus.mockResolvedValue(undefined);
      const mockRequest = { user: mockUser } as any;

      await expect(
        controller.getVideoStatus('bad-id', mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('streamDetail', () => {
    it('should return stream detail when user has access', async () => {
      roomsService.checkUserAccessToRoomAndVideo.mockResolvedValue(true);
      const mockStreamDetail = {
        urlStream: 'http://example.com/stream/video-uuid/master.m3u8',
      };
      videosService.getStreamDetail.mockResolvedValue(mockStreamDetail);
      const mockRequest = { user: mockUser } as any;

      const result = await controller.streamDetail(
        mockRoomId,
        mockVideoId,
        mockRequest,
      );

      expect(roomsService.checkUserAccessToRoomAndVideo).toHaveBeenCalledWith(
        mockRoomId,
        mockVideoId,
        mockUser.id,
      );
      expect(videosService.getStreamDetail).toHaveBeenCalledWith(
        mockUser.id,
        mockRoomId,
        mockVideoId,
      );
      expect(result).toEqual(mockStreamDetail);
    });

    it('should throw NotFoundException when user has no access', async () => {
      roomsService.checkUserAccessToRoomAndVideo.mockResolvedValue(false);
      const mockRequest = { user: mockUser } as any;

      await expect(
        controller.streamDetail(mockRoomId, mockVideoId, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when stream detail is not found', async () => {
      roomsService.checkUserAccessToRoomAndVideo.mockResolvedValue(true);
      videosService.getStreamDetail.mockResolvedValue(undefined);
      const mockRequest = { user: mockUser } as any;

      await expect(
        controller.streamDetail(mockRoomId, mockVideoId, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('streamFile', () => {
    it('should send .m3u8 file with correct content type', async () => {
      roomsService.checkUserAccessToRoomAndVideo.mockResolvedValue(true);
      const mockRequest = { payload: { userId: mockUser.id } } as any;
      const mockRes = {
        setHeader: jest.fn(),
        sendFile: jest.fn(),
      } as unknown as Response;

      await controller.streamFile(
        mockRoomId,
        mockVideoId,
        'master.m3u8',
        mockRequest,
        mockRes,
      );

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.apple.mpegurl',
      );
      expect(mockRes.sendFile).toHaveBeenCalled();
    });

    it('should send .ts file with correct content type', async () => {
      roomsService.checkUserAccessToRoomAndVideo.mockResolvedValue(true);
      const mockRequest = { payload: { userId: mockUser.id } } as any;
      const mockRes = {
        setHeader: jest.fn(),
        sendFile: jest.fn(),
      } as unknown as Response;

      await controller.streamFile(
        mockRoomId,
        mockVideoId,
        'segment.ts',
        mockRequest,
        mockRes,
      );

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'video/MP2T',
      );
    });

    it('should throw BadRequestException for unsupported file extension', async () => {
      const mockRequest = { payload: { userId: mockUser.id } } as any;
      const mockRes = {} as Response;

      await expect(
        controller.streamFile(
          mockRoomId,
          mockVideoId,
          'bad.exe',
          mockRequest,
          mockRes,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user has no room access', async () => {
      roomsService.checkUserAccessToRoomAndVideo.mockResolvedValue(false);
      const mockRequest = { payload: { userId: mockUser.id } } as any;
      const mockRes = {} as Response;

      await expect(
        controller.streamFile(
          mockRoomId,
          mockVideoId,
          'master.m3u8',
          mockRequest,
          mockRes,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for path traversal attempt', async () => {
      const mockRequest = { payload: { userId: mockUser.id } } as any;
      const mockRes = {} as Response;

      await expect(
        controller.streamFile(
          mockRoomId,
          mockVideoId,
          '..%2Fetc%2Fpasswd',
          mockRequest,
          mockRes,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
