import { Test, TestingModule } from '@nestjs/testing';
import { VideosController } from './videos.controller';
import { VideosService } from '../services/videos.service';
import { AuthGuard } from '@nestjs/passport';
import { BadRequestException } from '@nestjs/common';

// Mock the services
const mockVideosService = {
  handleUpload: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn(() => true),
};

describe('VideosController', () => {
  let controller: VideosController;
  let videosService: typeof mockVideosService;

  const mockUser = { id: 'user-uuid' };
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
    stream: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [{ provide: VideosService, useValue: mockVideosService }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<VideosController>(VideosController);
    videosService = module.get(VideosService);
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

      const result = await controller.upload(
        mockFile,
        mockRequest,
      );

      expect(videosService.handleUpload).toHaveBeenCalledWith(
        mockFile,
        mockUser.id,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw BadRequestException if no file is provided', async () => {
      const mockRequest = { user: mockUser } as any;

      await expect(
        controller.upload(undefined, mockRequest),
      ).rejects.toThrow(new BadRequestException('Video file is required.'));

      expect(videosService.handleUpload).not.toHaveBeenCalled();
    });
  });
});