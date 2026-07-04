import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { Message } from '../entities/message.entity';
import { HateSpeechDetectorService } from './hate-speech-detector.service';

describe('MessagesService', () => {
  let service: MessagesService;
  let messageRepo: any;
  let hateSpeechDetector: any;

  const mockUserId = 'user-uuid';
  const mockRoomId = 'room-uuid';

  const mockMessage: Message = {
    id: 'msg-uuid',
    text: 'hello world',
    userId: mockUserId,
    roomId: mockRoomId,
    user: null as any,
    room: null as any,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    hateSpeechDetector = { detect: jest.fn() };
    messageRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getRepositoryToken(Message),
          useValue: messageRepo,
        },
        { provide: HateSpeechDetectorService, useValue: hateSpeechDetector },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMessage', () => {
    it('should save original content when no hate speech is detected', async () => {
      hateSpeechDetector.detect.mockResolvedValue({
        isHate: false,
        message: 'ok',
      });
      messageRepo.create.mockReturnValue(mockMessage);
      messageRepo.save.mockResolvedValue(mockMessage);

      const result = await service.createMessage(
        mockUserId,
        mockRoomId,
        'hello world',
      );

      expect(hateSpeechDetector.detect).toHaveBeenCalledWith('hello world');
      expect(messageRepo.create).toHaveBeenCalledWith({
        userId: mockUserId,
        roomId: mockRoomId,
        text: 'hello world',
      });
      expect(result.text).toBe('hello world');
    });

    it('should censor content to ****** when hate speech is detected', async () => {
      hateSpeechDetector.detect.mockResolvedValue({
        isHate: true,
        message: 'hate',
      });
      const censoredMessage = { ...mockMessage, text: '******' };
      messageRepo.create.mockReturnValue(censoredMessage);
      messageRepo.save.mockResolvedValue(censoredMessage);

      const result = await service.createMessage(
        mockUserId,
        mockRoomId,
        'hateful content',
      );

      expect(messageRepo.create).toHaveBeenCalledWith({
        userId: mockUserId,
        roomId: mockRoomId,
        text: '******',
      });
      expect(result.text).toBe('******');
    });
  });

  describe('getMessage', () => {
    it('should return messages for a room with user relations', async () => {
      messageRepo.find.mockResolvedValue([mockMessage]);

      const result = await service.getMessage(mockRoomId);

      expect(messageRepo.find).toHaveBeenCalledWith({
        where: { roomId: mockRoomId },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual([mockMessage]);
    });

    it('should return empty array when no messages exist', async () => {
      messageRepo.find.mockResolvedValue([]);

      const result = await service.getMessage('empty-room');

      expect(result).toEqual([]);
    });
  });
});
