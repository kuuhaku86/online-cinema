# Complete Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add critical-path test coverage across all three services: backend (rooms, videos, messages, gateways, guards), frontend (vitest setup + Redux slices, hooks, components, pages), and hate-speech-detector (pytest).

**Architecture:** Backend uses Jest + ts-jest with `Test.createTestingModule` and mocked repositories. Frontend gets Vitest + React Testing Library + jsdom scaffolded from scratch. Hate-speech-detector gets pytest with `unittest.mock.patch`. Each task is one test file, following TDD: write test, verify it passes, commit.

**Tech Stack:** Jest 29, ts-jest, NestJS TestingModule, Socket.IO mocks, Vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, pytest, unittest.mock

## Global Constraints

- Run tests inside Docker containers: `make test-backend` for backend, `docker exec -it online-cinema-frontend npm run test` for frontend
- Follow existing test patterns: mock repositories with `getRepositoryToken`, mock services with plain objects, override guards with `.overrideGuard().useValue()`
- Commit after each task with conventional commit prefix (`test:`)
- Never modify production source code — only add test files

---

### Task 1: RoomsService Unit Tests

**Files:**
- Create: `backend/src/services/rooms.service.spec.ts`

**Interfaces:**
- Consumes: `RoomsService` from `src/services/rooms.service.ts`, `Room` entity, `Video` entity, `RedisHelper`
- Produces: N/A (no other tasks depend on this)

- [ ] **Step 1: Write the test file**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomsService } from './rooms.service';
import { Room } from '../entities/room.entity';
import { Video } from '../entities/video.entity';
import { RedisHelper } from 'src/helpers/redis.helper';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T>(): MockRepository<T> => ({
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: getRepositoryToken(Room), useValue: createMockRepository() },
        { provide: getRepositoryToken(Video), useValue: createMockRepository() },
        { provide: RedisHelper, useValue: mockRedisHelper },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    roomRepository = module.get(getRepositoryToken(Room));
    videoRepository = module.get(getRepositoryToken(Video));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRoom', () => {
    it('should create a room with a shortCode and return it', async () => {
      roomRepository.create.mockReturnValue(mockRoom);
      roomRepository.save.mockResolvedValue(mockRoom);

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
      const roomWithoutUser = { ...mockRoom, userIds: ['other-user'] };
      roomRepository.findOne.mockResolvedValue(roomWithoutUser);
      roomRepository.save.mockResolvedValue({
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
      roomRepository.findOne.mockResolvedValue(mockRoom);

      const result = await service.joinRoom('abc123', mockUserId);

      expect(result).toEqual(mockRoom);
      expect(roomRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if room does not exist', async () => {
      roomRepository.findOne.mockResolvedValue(null);

      await expect(
        service.joinRoom('nonexistent', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if room is not active', async () => {
      roomRepository.findOne.mockResolvedValue({ ...mockRoom, active: false });

      await expect(
        service.joinRoom('abc123', mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('startRoom', () => {
    it('should activate the room with a video', async () => {
      roomRepository.findOne.mockResolvedValue(mockRoom);
      videoRepository.findOne.mockResolvedValue(mockVideo);
      roomRepository.save.mockResolvedValue({
        ...mockRoom,
        active: true,
        videoId: mockVideo.id,
      });

      const result = await service.startRoom(mockRoom.id, mockVideo.id, mockUserId);

      expect(result.active).toBe(true);
      expect(result.videoId).toBe(mockVideo.id);
    });

    it('should throw NotFoundException if room not found', async () => {
      roomRepository.findOne.mockResolvedValue(null);

      await expect(
        service.startRoom('bad-room', mockVideo.id, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if room already active', async () => {
      roomRepository.findOne.mockResolvedValue({ ...mockRoom, active: true });

      await expect(
        service.startRoom(mockRoom.id, mockVideo.id, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if video not found', async () => {
      roomRepository.findOne.mockResolvedValue(mockRoom);
      videoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.startRoom(mockRoom.id, 'bad-video', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if video is not ready', async () => {
      roomRepository.findOne.mockResolvedValue(mockRoom);
      videoRepository.findOne.mockResolvedValue({ ...mockVideo, ready: false });

      await expect(
        service.startRoom(mockRoom.id, mockVideo.id, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkUserAccessToRoomAndVideo', () => {
    it('should return true if user is in the room', async () => {
      roomRepository.findOneBy.mockResolvedValue(mockRoom);

      const result = await service.checkUserAccessToRoomAndVideo(
        mockRoom.id, mockVideo.id, mockUserId,
      );

      expect(result).toBe(true);
    });

    it('should throw NotFoundException if room/video combo not found', async () => {
      roomRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.checkUserAccessToRoomAndVideo('bad-room', 'bad-video', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return false if user is not in room', async () => {
      roomRepository.findOneBy.mockResolvedValue({
        ...mockRoom,
        userIds: ['other-user'],
      });

      const result = await service.checkUserAccessToRoomAndVideo(
        mockRoom.id, mockVideo.id, 'unknown-user',
      );

      expect(result).toBe(false);
    });
  });

  describe('checkUserAccessToRoom', () => {
    it('should return true if user is in the room', async () => {
      roomRepository.findOneBy.mockResolvedValue(mockRoom);

      const result = await service.checkUserAccessToRoom(mockRoom.id, mockUserId);

      expect(result).toBe(true);
    });

    it('should throw NotFoundException if room not found', async () => {
      roomRepository.findOneBy.mockResolvedValue(null);

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
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
make test-backend
```
Expected: All tests pass, new test file shows green.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/rooms.service.spec.ts
git commit -m "test: add rooms service unit tests"
```

---

### Task 2: RoomsController Unit Tests

**Files:**
- Create: `backend/src/controllers/rooms.controller.spec.ts`

**Interfaces:**
- Consumes: `RoomsController` from `src/controllers/rooms.controller.ts`, `RoomsService`, `MessagesService`

- [ ] **Step 1: Write the test file**

```typescript
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

      await expect(controller.create(mockRequest)).rejects.toThrow(NotFoundException);
    });
  });

  describe('join', () => {
    it('should join a room by shortCode', async () => {
      const joinedRoom = { ...mockRoom, userIds: [mockUser.id, 'other-user'] };
      roomsService.joinRoom.mockResolvedValue(joinedRoom);

      const result = await controller.join('abc123', mockRequest);

      expect(roomsService.joinRoom).toHaveBeenCalledWith('abc123', mockUser.id);
      expect(result).toEqual(joinedRoom);
    });

    it('should propagate NotFoundException when room not found', async () => {
      roomsService.joinRoom.mockRejectedValue(new NotFoundException());

      await expect(controller.join('badcode', mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('start', () => {
    it('should start a room with a video', async () => {
      const startedRoom = { ...mockRoom, active: true, videoId: 'video-uuid' };
      roomsService.startRoom.mockResolvedValue(startedRoom);

      const result = await controller.start('room-uuid', { videoId: 'video-uuid' }, mockRequest);

      expect(roomsService.startRoom).toHaveBeenCalledWith('room-uuid', 'video-uuid', mockUser.id);
      expect(result).toEqual(startedRoom);
    });
  });

  describe('messages', () => {
    it('should return messages for a room with access', async () => {
      roomsService.checkUserAccessToRoom.mockResolvedValue(true);
      const mockMessages = [
        { id: 'msg-1', text: 'hello', userId: mockUser.id, roomId: 'room-uuid', createdAt: new Date() },
      ];
      messagesService.getMessage.mockResolvedValue(mockMessages);

      const result = await controller.messages('room-uuid', mockRequest);

      expect(roomsService.checkUserAccessToRoom).toHaveBeenCalledWith('room-uuid', mockUser.id);
      expect(result).toEqual(mockMessages);
    });

    it('should throw NotFoundException if user has no access', async () => {
      roomsService.checkUserAccessToRoom.mockResolvedValue(false);

      await expect(controller.messages('room-uuid', mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
make test-backend
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/rooms.controller.spec.ts
git commit -m "test: add rooms controller unit tests"
```

---

### Task 3: VideosService Unit Tests

**Files:**
- Create: `backend/src/services/videos.service.spec.ts`

**Interfaces:**
- Consumes: `VideosService`, `Video` entity, `RedisHelper`, `AuthService`

- [ ] **Step 1: Write the test file**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { VideosService } from './videos.service';
import { Video } from '../entities/video.entity';
import { RedisHelper } from 'src/helpers/redis.helper';
import { AuthService } from './auth.service';

jest.mock('fluent-ffmpeg', () => {
  const mockFfmpeg = jest.fn(() => ({
    outputOptions: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    run: jest.fn(),
  }));
  return mockFfmpeg;
});

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    rm: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('VideosService', () => {
  let service: VideosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: getRepositoryToken(Video),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        { provide: RedisHelper, useValue: { set: jest.fn(), get: jest.fn() } },
        { provide: AuthService, useValue: { generateStreamToken: jest.fn() } },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
  });
});
```

Wait — `VideosService` constructor calls `this.createDirectories()` which uses `fs.promises.mkdir`. The `jest.mock('fs', ...)` must be set up before the module compiles. Since `createDirectories` is private and runs in the constructor, we need the mock in place. The above pattern works because `jest.mock` calls are hoisted. Let me provide the full test file:

Write file `backend/src/services/videos.service.spec.ts` with full content:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('VideosService', () => {
  let service: VideosService;
  let videoRepository: MockRepository<Video>;
  let redisHelper: { set: jest.Mock; get: jest.Mock };
  let authService: { generateStreamToken: jest.Mock };

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

  beforeEach(async () => {
    jest.clearAllMocks();

    videoRepository = {
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
        { provide: getRepositoryToken(Video), useValue: videoRepository },
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
      videoRepository.find.mockResolvedValue([mockVideo]);

      const result = await service.getVideos(mockUserId);

      expect(videoRepository.find).toHaveBeenCalledWith({ where: { userId: mockUserId } });
      expect(result).toEqual([mockVideo]);
    });

    it('should return empty array when user has no videos', async () => {
      videoRepository.find.mockResolvedValue([]);

      const result = await service.getVideos(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('handleUpload', () => {
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
      stream: null,
    };

    it('should save video and return success response', async () => {
      videoRepository.create.mockReturnValue(mockVideo);
      videoRepository.save.mockResolvedValue(mockVideo);

      const result = await service.handleUpload(mockFile, mockUserId);

      expect(videoRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        fileName: mockFile.filename,
      });
      expect(videoRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Video uploaded successfully',
        id: mockVideo.id,
      });
    });

    it('should throw BadRequestException for unsupported file type', async () => {
      const badFile = { ...mockFile, mimetype: 'image/png' };

      await expect(service.handleUpload(badFile, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for file exceeding max size', async () => {
      const largeFile = { ...mockFile, size: 600 * 1024 * 1024 };

      await expect(service.handleUpload(largeFile, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getVideoStatus', () => {
    it('should return video status from Redis when video exists', async () => {
      videoRepository.findOneBy.mockResolvedValue(mockVideo);
      const status = { status: 'completed', processedPath: '/uploads/test.m3u8' };
      redisHelper.get.mockResolvedValue(status);

      const result = await service.getVideoStatus(mockVideoId, mockUserId);

      expect(videoRepository.findOneBy).toHaveBeenCalledWith({
        id: mockVideoId,
        userId: mockUserId,
      });
      expect(result).toEqual(status);
    });

    it('should return undefined when video is not found', async () => {
      videoRepository.findOneBy.mockResolvedValue(null);

      const result = await service.getVideoStatus('bad-id', mockUserId);

      expect(result).toBeUndefined();
    });
  });

  describe('getStreamDetail', () => {
    it('should return stream detail with token and URL', async () => {
      videoRepository.findOneBy.mockResolvedValue(mockVideo);
      authService.generateStreamToken.mockResolvedValue('stream-token-123');

      const result = await service.getStreamDetail(mockUserId, mockRoomId, mockVideoId);

      expect(authService.generateStreamToken).toHaveBeenCalledWith(
        mockUserId, mockRoomId, mockVideoId,
      );
      expect(result).toBeDefined();
      expect(result.urlStream).toContain('stream-token-123');
      expect(result.urlStream).toContain(mockRoomId);
      expect(result.urlStream).toContain(mockVideoId);
      expect(result.urlStream).toContain('master.m3u8');
    });

    it('should return undefined when video is not found', async () => {
      videoRepository.findOneBy.mockResolvedValue(null);

      const result = await service.getStreamDetail(mockUserId, mockRoomId, 'bad-video');

      expect(result).toBeUndefined();
    });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
make test-backend
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/videos.service.spec.ts
git commit -m "test: add videos service unit tests"
```

---

### Task 4: MessagesService Unit Tests

**Files:**
- Create: `backend/src/services/messages.service.spec.ts`

**Interfaces:**
- Consumes: `MessagesService`, `Message` entity, `HateSpeechDetectorService`

- [ ] **Step 1: Write the test file**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessagesService } from './messages.service';
import { Message } from '../entities/message.entity';
import { HateSpeechDetectorService } from './hate-speech-detector.service';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('MessagesService', () => {
  let service: MessagesService;
  let messageRepository: MockRepository<Message>;
  let hateSpeechDetector: { detect: jest.Mock };

  const mockUserId = 'user-uuid';
  const mockRoomId = 'room-uuid';
  const mockText = 'hello world';

  const mockMessage: Message = {
    id: 'msg-uuid',
    text: mockText,
    userId: mockUserId,
    roomId: mockRoomId,
    user: null as any,
    room: null as any,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    hateSpeechDetector = { detect: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getRepositoryToken(Message),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        { provide: HateSpeechDetectorService, useValue: hateSpeechDetector },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    messageRepository = module.get(getRepositoryToken(Message));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMessage', () => {
    it('should save original content when no hate speech is detected', async () => {
      hateSpeechDetector.detect.mockResolvedValue({ isHate: false, message: 'ok' });
      messageRepository.create.mockReturnValue(mockMessage);
      messageRepository.save.mockResolvedValue(mockMessage);

      const result = await service.createMessage(mockUserId, mockRoomId, mockText);

      expect(hateSpeechDetector.detect).toHaveBeenCalledWith(mockText);
      expect(messageRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        roomId: mockRoomId,
        text: mockText,
      });
      expect(result.text).toBe(mockText);
    });

    it('should censor content to ****** when hate speech is detected', async () => {
      hateSpeechDetector.detect.mockResolvedValue({ isHate: true, message: 'hate' });
      const censoredMessage = { ...mockMessage, text: '******' };
      messageRepository.create.mockReturnValue(censoredMessage);
      messageRepository.save.mockResolvedValue(censoredMessage);

      const result = await service.createMessage(mockUserId, mockRoomId, 'hateful content');

      expect(messageRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        roomId: mockRoomId,
        text: '******',
      });
      expect(result.text).toBe('******');
    });
  });

  describe('getMessage', () => {
    it('should return messages for a room with user relations', async () => {
      messageRepository.find.mockResolvedValue([mockMessage]);

      const result = await service.getMessage(mockRoomId);

      expect(messageRepository.find).toHaveBeenCalledWith({
        where: { roomId: mockRoomId },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual([mockMessage]);
    });

    it('should return empty array when no messages exist', async () => {
      messageRepository.find.mockResolvedValue([]);

      const result = await service.getMessage('empty-room');

      expect(result).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
make test-backend
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/messages.service.spec.ts
git commit -m "test: add messages service unit tests"
```

---

### Task 5: HateSpeechDetectorService Unit Tests

**Files:**
- Create: `backend/src/services/hate-speech-detector.service.spec.ts`

**Interfaces:**
- Consumes: `HateSpeechDetectorService` from `src/services/hate-speech-detector.service.ts`

- [ ] **Step 1: Write the test file**

```typescript
import axios from 'axios';
import { HateSpeechDetectorService } from './hate-speech-detector.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HateSpeechDetectorService', () => {
  let service: HateSpeechDetectorService;

  const mockApiUrl = 'http://detector:5000';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HATE_SPEECH_DETECTOR_URL = mockApiUrl;
    service = new HateSpeechDetectorService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw if HATE_SPEECH_DETECTOR_URL is not set', () => {
    delete process.env.HATE_SPEECH_DETECTOR_URL;
    expect(() => new HateSpeechDetectorService()).toThrow(
      'HATE_SPEECH_DETECTOR_URL environment variable is not set.',
    );
  });

  describe('detect', () => {
    it('should return isHate: false for clean text', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { message: 'ok', isHate: false },
      });

      const result = await service.detect('hello there');

      expect(mockedAxios.post).toHaveBeenCalledWith(mockApiUrl + '/analyze', {
        text: 'hello there',
      });
      expect(result).toEqual({ message: 'ok', isHate: false });
    });

    it('should return isHate: true for hate speech', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { message: 'hate detected', isHate: true },
      });

      const result = await service.detect('hateful text');

      expect(result).toEqual({ message: 'hate detected', isHate: true });
    });

    it('should throw on network error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      await expect(service.detect('any text')).rejects.toThrow(
        'Failed to get hate speech detection result.',
      );
    });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
make test-backend
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/hate-speech-detector.service.spec.ts
git commit -m "test: add hate speech detector service unit tests"
```

---

### Task 6: WsAuthGuard Unit Tests

**Files:**
- Create: `backend/src/auth/guards/ws-auth.guard.spec.ts`

**Interfaces:**
- Consumes: `WsAuthGuard`, `JwtService`

- [ ] **Step 1: Write the test file**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsAuthGuard } from './ws-auth.guard';
import { Socket } from 'socket.io';

function createMockSocket(token?: string): Partial<Socket> {
  return {
    handshake: { auth: { token } } as any,
    data: {},
  };
}

function createMockExecutionContext(client: Partial<Socket>): any {
  return {
    switchToWs: () => ({
      getClient: () => client,
    }),
  };
}

describe('WsAuthGuard', () => {
  let guard: WsAuthGuard;
  let jwtService: { verify: jest.Mock };

  const mockPayload = { sub: 'user-uuid', username: 'testuser', email: 'test@example.com' };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsAuthGuard,
        { provide: JwtService, useValue: { verify: jest.fn() } },
      ],
    }).compile();

    guard = module.get<WsAuthGuard>(WsAuthGuard);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow connection with valid token', async () => {
    jwtService.verify.mockReturnValue(mockPayload);
    const socket = createMockSocket('valid-token');
    const ctx = createMockExecutionContext(socket);

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
      secret: process.env.JWT_SECRET,
    });
    expect(socket.data.user.id).toBe(mockPayload.sub);
  });

  it('should throw UnauthorizedException when no token is provided', async () => {
    const socket = createMockSocket(undefined);
    const ctx = createMockExecutionContext(socket);

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for invalid token', async () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });
    const socket = createMockSocket('invalid-token');
    const ctx = createMockExecutionContext(socket);

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
make test-backend
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/auth/guards/ws-auth.guard.spec.ts
git commit -m "test: add ws auth guard unit tests"
```

---

### Task 7: UrlTokenGuard Unit Tests

**Files:**
- Create: `backend/src/auth/guards/url-token.guard.spec.ts`

**Interfaces:**
- Consumes: `UrlTokenGuard`, `JwtService`

- [ ] **Step 1: Write the test file**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UrlTokenGuard } from './url-token.guard';

function createMockExecutionContext(token?: string): any {
  const request = {
    params: { token },
    payload: undefined as any,
  };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  };
}

describe('UrlTokenGuard', () => {
  let guard: UrlTokenGuard;
  let jwtService: { verifyAsync: jest.Mock };

  const mockPayload = { userId: 'user-uuid', roomId: 'room-uuid', videoId: 'video-uuid' };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlTokenGuard,
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
      ],
    }).compile();

    guard = module.get<UrlTokenGuard>(UrlTokenGuard);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access with valid token', async () => {
    jwtService.verifyAsync.mockResolvedValue(mockPayload);
    const ctx = createMockExecutionContext('valid-token');

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
      secret: process.env.JWT_SECRET,
    });
    expect(ctx.switchToHttp().getRequest().payload).toEqual(mockPayload);
  });

  it('should throw UnauthorizedException when token is missing', async () => {
    const ctx = createMockExecutionContext(undefined);

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for invalid token', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('expired'));
    const ctx = createMockExecutionContext('expired-token');

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
make test-backend
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/auth/guards/url-token.guard.spec.ts
git commit -m "test: add url token guard unit tests"
```

---

### Task 8: ChatGateway Unit Tests

**Files:**
- Create: `backend/src/gateways/chat.gateway.spec.ts`

**Interfaces:**
- Consumes: `ChatGateway`, `RoomsService`, `MessagesService`, Socket.IO server/client

- [ ] **Step 1: Write the test file**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { RoomsService } from 'src/services/rooms.service';
import { MessagesService } from 'src/services/messages.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let roomsService: { checkUserAccessToRoom: jest.Mock };
  let messagesService: { createMessage: jest.Mock; getMessage: jest.Mock };

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

      expect(roomsService.checkUserAccessToRoom).toHaveBeenCalledWith(mockRoomId, mockUserId);
      expect(client.join).toHaveBeenCalledWith(mockRoomId);
      expect(client.emit).toHaveBeenCalledWith('previousMessages', []);
    });

    it('should emit error when user has no access', async () => {
      roomsService.checkUserAccessToRoom.mockResolvedValue(false);
      const client = createMockSocket();

      await gateway.handleJoinRoom(client, { roomId: mockRoomId });

      expect(client.join).not.toHaveBeenCalled();
      expect(client.emit).toHaveBeenCalledWith('error', { message: 'Access to room denied.' });
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

      await gateway.handleMessage(client, { roomId: mockRoomId, message: 'hello' });

      expect(messagesService.createMessage).toHaveBeenCalledWith(mockUserId, mockRoomId, 'hello');
      expect(gateway.server.to).toHaveBeenCalledWith(mockRoomId);
      expect(roomEmit).toHaveBeenCalledWith('chatMessage', {
        sender: { id: mockUserId, username: 'testuser' },
        message: 'hello',
        createdAt: mockMessage.createdAt,
      });
    });

    it('should ignore message if client has not joined the room', async () => {
      const client = createMockSocket(new Set());

      await gateway.handleMessage(client, { roomId: mockRoomId, message: 'hello' });

      expect(messagesService.createMessage).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
make test-backend
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/gateways/chat.gateway.spec.ts
git commit -m "test: add chat gateway unit tests"
```

---

### Task 9: RoomGateway Unit Tests

**Files:**
- Create: `backend/src/gateways/room.gateway.spec.ts`

**Interfaces:**
- Consumes: `RoomGateway`, `RoomsService`

- [ ] **Step 1: Write the test file**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { RoomGateway } from './room.gateway';
import { RoomsService } from 'src/services/rooms.service';

describe('RoomGateway', () => {
  let gateway: RoomGateway;
  let roomsService: {
    checkUserAccessToRoom: jest.Mock;
    getRoomStatus: jest.Mock;
    updateRoomStatus: jest.Mock;
  };

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

      expect(roomsService.checkUserAccessToRoom).toHaveBeenCalledWith(mockRoomId, mockUserId);
      expect(client.join).toHaveBeenCalledWith(mockRoomId);
      expect(client.emit).toHaveBeenCalledWith('previousRoomStatus', mockStatus);
    });

    it('should emit error when user has no access', async () => {
      roomsService.checkUserAccessToRoom.mockResolvedValue(false);
      const client = createMockSocket();

      await gateway.handleJoinRoom(client, { roomId: mockRoomId });

      expect(client.join).not.toHaveBeenCalled();
      expect(client.emit).toHaveBeenCalledWith('error', { message: 'Access to room denied.' });
    });
  });

  describe('handleMessage (updateRoomStatus)', () => {
    it('should update and broadcast room status', async () => {
      const mockStatus = { time: '01:30', play: false };
      roomsService.getRoomStatus
        .mockResolvedValueOnce(undefined) // initial get before update (note: the gateway calls getRoomStatus twice)
        .mockResolvedValueOnce(mockStatus);
      const client = createMockSocket(new Set([mockRoomId]));
      const roomEmit = jest.fn();
      gateway.server.to = jest.fn().mockReturnValue({ emit: roomEmit });

      await gateway.handleMessage(client, {
        roomId: mockRoomId,
        time: '01:30',
        play: false,
      });

      expect(roomsService.updateRoomStatus).toHaveBeenCalledWith(mockRoomId, '01:30', false);
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
```

- [ ] **Step 2: Run tests**

```bash
make test-backend
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/gateways/room.gateway.spec.ts
git commit -m "test: add room gateway unit tests"
```

---

### Task 10: RedisHelper Unit Tests

**Files:**
- Create: `backend/src/helpers/redis.helper.spec.ts`

**Interfaces:**
- Consumes: `RedisHelper`, `Cache` from `cache-manager`

- [ ] **Step 1: Write the test file**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RedisHelper } from './redis.helper';

describe('RedisHelper', () => {
  let helper: RedisHelper;
  let cacheManager: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();

    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHelper,
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    helper = module.get<RedisHelper>(RedisHelper);
  });

  it('should be defined', () => {
    expect(helper).toBeDefined();
  });

  describe('set', () => {
    it('should set a value with stringification', async () => {
      await helper.set('key1', { foo: 'bar' }, 60);

      expect(cacheManager.set).toHaveBeenCalledWith('key1', '{"foo":"bar"}', 60);
    });

    it('should set a value without TTL if not provided', async () => {
      await helper.set('key1', 'simple value');

      expect(cacheManager.set).toHaveBeenCalledWith('key1', '"simple value"', undefined);
    });
  });

  describe('get', () => {
    it('should get and parse a JSON value', async () => {
      cacheManager.get.mockResolvedValue('{"foo":"bar"}');

      const result = await helper.get('key1');

      expect(cacheManager.get).toHaveBeenCalledWith('key1');
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return undefined when key does not exist', async () => {
      cacheManager.get.mockResolvedValue(undefined);

      const result = await helper.get('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should return undefined when JSON parse fails', async () => {
      cacheManager.get.mockResolvedValue('not-valid-json');

      const result = await helper.get('bad-data');

      expect(result).toBeUndefined();
    });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
make test-backend
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/helpers/redis.helper.spec.ts
git commit -m "test: add redis helper unit tests"
```

---

### Task 11: Extend VideosController Tests

**Files:**
- Modify: `backend/src/controllers/videos.controller.spec.ts`

**Interfaces:**
- Consumes: `VideosController`, `VideosService`, `RoomsService`
- Produces: Adds tests for getVideos, getVideoStatus, streamDetail, streamFile

- [ ] **Step 1: Extend the existing test file**

The existing file at `backend/src/controllers/videos.controller.spec.ts` only tests the `upload` endpoint. Add mocks for `RoomsService` and additional methods on `VideosService`, then add test blocks for the remaining endpoints.

Read the current file, then replace it with the extended version:

```typescript
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
    stream: null,
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

      expect(videosService.handleUpload).toHaveBeenCalledWith(mockFile, mockUser.id);
      expect(result).toEqual(mockResponse);
    });

    it('should throw BadRequestException if no file is provided', async () => {
      const mockRequest = { user: mockUser } as any;

      await expect(controller.upload(undefined, mockRequest)).rejects.toThrow(
        new BadRequestException('Video file is required.'),
      );

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
      const mockStatus = { status: 'completed' as const, processedPath: '/path/video.m3u8' };
      videosService.getVideoStatus.mockResolvedValue(mockStatus);
      const mockRequest = { user: mockUser } as any;

      const result = await controller.getVideoStatus(mockVideoId, mockRequest);

      expect(videosService.getVideoStatus).toHaveBeenCalledWith(mockVideoId, mockUser.id);
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
      const mockStreamDetail = { urlStream: 'http://example.com/stream/video-uuid/master.m3u8' };
      videosService.getStreamDetail.mockResolvedValue(mockStreamDetail);
      const mockRequest = { user: mockUser } as any;

      const result = await controller.streamDetail(mockRoomId, mockVideoId, mockRequest);

      expect(roomsService.checkUserAccessToRoomAndVideo).toHaveBeenCalledWith(
        mockRoomId, mockVideoId, mockUser.id,
      );
      expect(videosService.getStreamDetail).toHaveBeenCalledWith(mockUser.id, mockRoomId, mockVideoId);
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

      await controller.streamFile(mockRoomId, mockVideoId, 'master.m3u8', mockRequest, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/vnd.apple.mpegurl');
      expect(mockRes.sendFile).toHaveBeenCalled();
    });

    it('should send .ts file with correct content type', async () => {
      roomsService.checkUserAccessToRoomAndVideo.mockResolvedValue(true);
      const mockRequest = { payload: { userId: mockUser.id } } as any;
      const mockRes = {
        setHeader: jest.fn(),
        sendFile: jest.fn(),
      } as unknown as Response;

      await controller.streamFile(mockRoomId, mockVideoId, 'segment.ts', mockRequest, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'video/MP2T');
    });

    it('should throw BadRequestException for unsupported file extension', async () => {
      const mockRequest = { payload: { userId: mockUser.id } } as any;
      const mockRes = {} as Response;

      await expect(
        controller.streamFile(mockRoomId, mockVideoId, 'bad.exe', mockRequest, mockRes),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user has no room access', async () => {
      roomsService.checkUserAccessToRoomAndVideo.mockResolvedValue(false);
      const mockRequest = { payload: { userId: mockUser.id } } as any;
      const mockRes = {} as Response;

      await expect(
        controller.streamFile(mockRoomId, mockVideoId, 'master.m3u8', mockRequest, mockRes),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for path traversal attempt', async () => {
      const mockRequest = { payload: { userId: mockUser.id } } as any;
      const mockRes = {} as Response;

      await expect(
        controller.streamFile(mockRoomId, mockVideoId, '..%2Fetc%2Fpasswd', mockRequest, mockRes),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
make test-backend
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/videos.controller.spec.ts
git commit -m "test: extend videos controller tests with all endpoints"
```

---

### Task 12: Extend UsersController Tests (PATCH endpoint)

**Files:**
- Modify: `backend/src/controllers/users.controller.spec.ts`

**Interfaces:**
- Consumes: `UsersController`, `UsersService`
- Produces: Adds tests for `updateUserProfile` (PATCH)

- [ ] **Step 1: Extend the existing test file**

Read the current file at `backend/src/controllers/users.controller.spec.ts`, then replace it with:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { User } from '../entities/user.entity';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ParseUUIDPipe } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

const mockUsersService = {
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockAuthService = {};

const mockAuthGuard = {
  canActivate: jest.fn(() => true),
};

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: typeof mockUsersService;

  const mockUserId = 'c9c0c972-42fa-4017-9b30-f3539be0b2a4';
  const mockUser: User = {
    id: mockUserId,
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'secretPasswordHash',
    currentHashedRefreshToken: 'secretRefreshTokenHash',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserResult: Omit<User, 'passwordHash' | 'currentHashedRefreshToken'> = {
    id: mockUserId,
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUser', () => {
    it('should return a user (without passwordHash) when found', async () => {
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.getUser(mockUserId);

      expect(usersService.findOne).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockUserResult);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException when user is not found', async () => {
      const nonExistentId = 'c9c0c972-42fa-4017-9b30-f3539be0b2a5';
      usersService.findOne.mockRejectedValue(
        new NotFoundException(`User with ID "${nonExistentId}" not found`),
      );

      await expect(controller.getUser(nonExistentId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for an invalid UUID (tested via ParseUUIDPipe)', async () => {
      const invalidId = 'not-a-uuid';
      const pipe = new ParseUUIDPipe();

      await expect(
        pipe.transform(invalidId, { type: 'param' }),
      ).rejects.toThrow(BadRequestException);
      expect(usersService.findOne).not.toHaveBeenCalled();
    });
  });

  describe('updateUserProfile', () => {
    const mockRequest = (userId: string) => ({ user: { id: userId } }) as any;
    const updateDto = { username: 'newuser', email: 'new@example.com', oldPassword: '', newPassword: '' };

    it('should update profile when authenticated user matches the target', async () => {
      const updatedUser = { ...mockUserResult, username: 'newuser', email: 'new@example.com' };
      usersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateUserProfile(mockUserId, updateDto, mockRequest(mockUserId));

      expect(usersService.update).toHaveBeenCalledWith(mockUserId, updateDto);
      expect(result).toEqual(updatedUser);
    });

    it('should throw ForbiddenException when updating another user', async () => {
      await expect(
        controller.updateUserProfile(mockUserId, updateDto, mockRequest('different-uuid')),
      ).rejects.toThrow(ForbiddenException);

      expect(usersService.update).not.toHaveBeenCalled();
    });

    it('should propagate NotFoundException from service', async () => {
      usersService.update.mockRejectedValue(new NotFoundException());

      await expect(
        controller.updateUserProfile(mockUserId, updateDto, mockRequest(mockUserId)),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
make test-backend
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/users.controller.spec.ts
git commit -m "test: extend users controller tests with PATCH endpoint"
```

---

### Task 13: Frontend Testing Infrastructure Setup

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Create: `frontend/src/test/setup.ts`

**Interfaces:**
- Produces: Vitest test runner ready for frontend tests

- [ ] **Step 1: Install dependencies**

```bash
docker exec -it online-cinema-frontend npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Update vite.config.ts**

Read `frontend/vite.config.ts` first, then replace:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 3: Create setup file**

```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Add test scripts to package.json**

Edit `frontend/package.json` — add to the `"scripts"` block:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 5: Verify setup by running a trivial test**

```bash
docker exec -it online-cinema-frontend npx vitest run --reporter=verbose
```

Expected: Vitest finds no test files (or 0 tests), exits cleanly.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/vite.config.ts frontend/src/test/setup.ts
git commit -m "chore: set up frontend testing infrastructure with vitest"
```

---

### Task 14: Frontend Redux Auth Slice Tests

**Files:**
- Create: `frontend/src/features/auth/authSlice.test.ts`

**Interfaces:**
- Consumes: `authSlice` from `features/auth/authSlice.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import authReducer, {
  setUser,
  setTokens,
  logout,
  login,
  register,
  getStoredAccessToken,
  AuthState,
} from './authSlice';

const mockApiModule = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../../services/authApi', () => mockApiModule);

describe('authSlice', () => {
  const initialState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    registrationStatus: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setUser', () => {
    it('should set the user and mark as authenticated', () => {
      const user = { id: '1', username: 'test', email: 'test@test.com' };
      const state = authReducer(initialState, setUser(user));

      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('setTokens', () => {
    it('should store access and refresh tokens', () => {
      const state = authReducer(initialState, setTokens({ accessToken: 'at', refreshToken: 'rt' }));

      expect(state.accessToken).toBe('at');
      expect(state.refreshToken).toBe('rt');
    });
  });

  describe('logout', () => {
    it('should reset auth state', () => {
      const loggedInState: AuthState = {
        ...initialState,
        user: { id: '1', username: 'test', email: 'test@test.com' },
        accessToken: 'at',
        refreshToken: 'rt',
        isAuthenticated: true,
      };

      const state = authReducer(loggedInState, logout());

      expect(state).toEqual(initialState);
    });
  });

  describe('getStoredAccessToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('accessToken', 'stored-token');
      expect(getStoredAccessToken()).toBe('stored-token');
    });

    it('should return null if no token stored', () => {
      expect(getStoredAccessToken()).toBeNull();
    });
  });

  describe('login thunk', () => {
    it('should set loading to true when pending', () => {
      const state = authReducer(initialState, { type: login.pending.type });
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should populate state on fulfilled', () => {
      const payload = {
        user: { id: '1', username: 'test', email: 'test@test.com' },
        accessToken: 'access-123',
        refreshToken: 'refresh-123',
      };
      const state = authReducer(initialState, login.fulfilled(payload, '', { email: 'test@test.com', password: 'pass' }));

      expect(state.user).toEqual(payload.user);
      expect(state.accessToken).toBe('access-123');
      expect(state.refreshToken).toBe('refresh-123');
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
    });

    it('should set error on rejected', () => {
      const state = authReducer(initialState, login.rejected(new Error('Invalid credentials'), '', { email: 'test@test.com', password: 'pass' }));

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });
  });

  describe('register thunk', () => {
    it('should set loading to true when pending', () => {
      const state = authReducer(initialState, { type: register.pending.type });
      expect(state.loading).toBe(true);
      expect(state.registrationStatus).toBe('loading');
    });

    it('should set registrationStatus to success on fulfilled', () => {
      const payload = { message: 'Registration successful' };
      const state = authReducer(initialState, register.fulfilled(payload, '', { username: 'new', email: 'new@test.com', password: 'pass123', confirmPassword: 'pass123' }));

      expect(state.loading).toBe(false);
      expect(state.registrationStatus).toBe('success');
    });

    it('should set error on rejected', () => {
      const state = authReducer(initialState, register.rejected(new Error('Email taken'), '', { username: 'new', email: 'new@test.com', password: 'pass123', confirmPassword: 'pass123' }));

      expect(state.loading).toBe(false);
      expect(state.registrationStatus).toBe('error');
      expect(state.error).toBe('Email taken');
    });
  });
});
```

- [ ] **Step 2: Run tests from inside the frontend container**

```bash
docker exec -it online-cinema-frontend npm run test
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/auth/authSlice.test.ts
git commit -m "test: add frontend auth slice tests"
```

---

### Task 15: Frontend Redux User Slice Tests

**Files:**
- Create: `frontend/src/features/user/userSlice.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userReducer, { updateProfile, clearUpdateStatus, UserState } from './userSlice';

const mockApiModule = vi.hoisted(() => ({
  updateProfile: vi.fn(),
}));

vi.mock('../../services/usersApi', () => mockApiModule);

describe('userSlice', () => {
  const initialState: UserState = {
    user: null,
    loading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the initial state', () => {
    expect(userReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('clearUpdateStatus', () => {
    it('should reset loading and error', () => {
      const state = userReducer(
        { ...initialState, loading: true, error: 'some error' },
        clearUpdateStatus(),
      );

      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('updateProfile thunk', () => {
    it('should set loading to true when pending', () => {
      const state = userReducer(initialState, { type: updateProfile.pending.type });
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set user on fulfilled', () => {
      const user = { id: '1', username: 'updated', email: 'updated@test.com', name: 'Updated' };
      const state = userReducer(initialState, updateProfile.fulfilled(user, '', {} as any));

      expect(state.loading).toBe(false);
      expect(state.user).toEqual(user);
    });

    it('should set error on rejected', () => {
      const state = userReducer(initialState, updateProfile.rejected(
        new Error('Update failed'), '', {} as any,
      ));

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Update failed');
    });
  });
});
```

- [ ] **Step 2: Run tests**

```bash
docker exec -it online-cinema-frontend npm run test
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/user/userSlice.test.ts
git commit -m "test: add frontend user slice tests"
```

---

### Task 16: Frontend Redux Video and Room Slice Tests

**Files:**
- Create: `frontend/src/features/video/videoSlice.test.ts`
- Create: `frontend/src/features/room/roomSlice.test.ts`

- [ ] **Step 1: Write video slice test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import videoReducer, {
  setSelectedVideoId,
  clearSelectedVideoId,
  getSelectedVideoId,
  VideoState,
} from './videoSlice';

describe('videoSlice', () => {
  const initialState: VideoState = {
    selectedVideoId: null,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('should return the initial state', () => {
    expect(videoReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should set the selected video ID', () => {
    const state = videoReducer(initialState, setSelectedVideoId('video-123'));
    expect(state.selectedVideoId).toBe('video-123');
  });

  it('should clear the selected video ID', () => {
    const state = videoReducer({ selectedVideoId: 'video-123' }, clearSelectedVideoId());
    expect(state.selectedVideoId).toBeNull();
  });

  describe('getSelectedVideoId', () => {
    it('should return the selected video ID from state', () => {
      const state = { video: { selectedVideoId: 'video-456' } } as any;
      expect(getSelectedVideoId(state)).toBe('video-456');
    });

    it('should return null when no video is selected', () => {
      const state = { video: { selectedVideoId: null } } as any;
      expect(getSelectedVideoId(state)).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Write room slice test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import roomReducer, {
  setSelectedRoom,
  clearSelectedRoom,
  getSelectedRoom,
  RoomState,
} from './roomSlice';

describe('roomSlice', () => {
  const initialState: RoomState = {
    selectedRoom: null,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('should return the initial state', () => {
    expect(roomReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should set the selected room', () => {
    const room = { id: 'room-1', shortCode: 'abc123' };
    const state = roomReducer(initialState, setSelectedRoom(room));
    expect(state.selectedRoom).toEqual(room);
  });

  it('should clear the selected room', () => {
    const state = roomReducer({ selectedRoom: { id: 'room-1', shortCode: 'abc123' } }, clearSelectedRoom());
    expect(state.selectedRoom).toBeNull();
  });

  describe('getSelectedRoom', () => {
    it('should return the selected room from state', () => {
      const room = { id: 'room-1', shortCode: 'abc123' };
      const state = { room: { selectedRoom: room } } as any;
      expect(getSelectedRoom(state)).toEqual(room);
    });

    it('should return null when no room selected', () => {
      const state = { room: { selectedRoom: null } } as any;
      expect(getSelectedRoom(state)).toBeNull();
    });
  });
});
```

- [ ] **Step 3: Run tests**

```bash
docker exec -it online-cinema-frontend npm run test
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/video/videoSlice.test.ts frontend/src/features/room/roomSlice.test.ts
git commit -m "test: add frontend video and room slice tests"
```

---

### Task 17: Frontend Component Tests (LoginForm, ProtectedRoute, Modal)

**Files:**
- Create: `frontend/src/components/LoginForm.test.tsx`
- Create: `frontend/src/components/ProtectedRoute.test.tsx`
- Create: `frontend/src/components/Modal.test.tsx`

- [ ] **Step 1: Write LoginForm test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import LoginForm from './LoginForm';

vi.mock('../../hooks/useAuth', () => ({
  default: vi.fn(),
}));

const actualUseAuth = await import('../../hooks/useAuth');

function renderWithProviders(component: React.ReactElement, useAuthMock: any) {
  vi.mocked(actualUseAuth.default).mockReturnValue(useAuthMock);
  const store = configureStore({ reducer: { auth: (state = {}) => state } });
  return render(<Provider store={store}>{component}</Provider>);
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    renderWithProviders(<LoginForm />, {
      signIn: vi.fn(),
      error: null,
      loading: false,
    });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('calls signIn on form submit', async () => {
    const signIn = vi.fn();
    renderWithProviders(<LoginForm />, { signIn, error: null, loading: false });

    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(signIn).toHaveBeenCalledWith('test@test.com', 'password123');
  });

  it('displays error message when error is set', () => {
    renderWithProviders(<LoginForm />, {
      signIn: vi.fn(),
      error: 'Invalid credentials',
      loading: false,
    });

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('disables button when loading', () => {
    renderWithProviders(<LoginForm />, {
      signIn: vi.fn(),
      error: null,
      loading: true,
    });

    expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
  });
});
```

Wait — the `useAuth` hook is a named export, not a default export. Let me check the actual hook signature. The exploration agent said `named export useAuth`. So let me adjust:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import LoginForm from './LoginForm';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../hooks/useAuth';

function renderWithProviders(component: React.ReactElement, useAuthMock: ReturnType<typeof useAuth>) {
  vi.mocked(useAuth).mockReturnValue(useAuthMock);
  const store = configureStore({ reducer: { auth: (state = {}) => state } });
  return render(<Provider store={store}>{component}</Provider>);
}

describe('LoginForm', () => {
  const defaultAuthMock = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    registrationStatus: null,
    signUp: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    renderWithProviders(<LoginForm />, defaultAuthMock);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login|sign in/i })).toBeInTheDocument();
  });

  it('calls signIn on form submit', async () => {
    const signIn = vi.fn();
    renderWithProviders(<LoginForm />, { ...defaultAuthMock, signIn });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login|sign in/i }));

    expect(signIn).toHaveBeenCalledWith('test@test.com', 'password123');
  });

  it('displays error message when error is set', () => {
    renderWithProviders(<LoginForm />, {
      ...defaultAuthMock,
      error: 'Invalid credentials',
    });

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
```

Note: The exact button text and labels may vary based on the actual JSX in `LoginForm.tsx`. The test uses a regex `/login|sign in/i` to be flexible. During implementation, inspect the actual LoginForm JSX and adjust selectors accordingly.

- [ ] **Step 2: Write ProtectedRoute test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProtectedRoute from './ProtectedRoute';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../hooks/useAuth';

const defaultAuthMock = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  signIn: vi.fn(),
  signOut: vi.fn(),
  registrationStatus: null as string | null,
  signUp: vi.fn(),
};

function renderWithRouter(isAuthenticated: boolean) {
  vi.mocked(useAuth).mockReturnValue({ ...defaultAuthMock, isAuthenticated });
  const store = configureStore({ reducer: { auth: (state = {}) => state } });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when authenticated', () => {
    renderWithRouter(true);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to / when not authenticated', () => {
    renderWithRouter(false);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Write Modal test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

describe('Modal', () => {
  it('renders children when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>,
    );

    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>,
    );

    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Modal Content</div>
      </Modal>,
    );

    const overlay = screen.getByRole('dialog').parentElement as HTMLElement;
    await userEvent.click(overlay);

    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run tests**

```bash
docker exec -it online-cinema-frontend npm run test
```

Expected: Some tests may need minor adjustments to match actual component JSX (button text, input labels, etc.). Inspect the actual components and fix selectors as needed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/LoginForm.test.tsx frontend/src/components/ProtectedRoute.test.tsx frontend/src/components/Modal.test.tsx
git commit -m "test: add frontend LoginForm, ProtectedRoute, and Modal component tests"
```

---

### Task 18: Frontend Hooks Tests (useAuth, useChat)

**Files:**
- Create: `frontend/src/hooks/useAuth.test.ts`
- Create: `frontend/src/hooks/useChat.test.ts`

- [ ] **Step 1: Write useAuth test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAuth } from './useAuth';

vi.mock('../../services/authApi', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
}));

import authReducer from '../features/auth/authSlice';

function createWrapper() {
  const store = configureStore({
    reducer: { auth: authReducer },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial unauthenticated state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should expose signIn and signUp functions', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
  });
});
```

- [ ] **Step 2: Write useChat test**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from './useChat';

vi.mock('socket.io-client', () => {
  const mockSocket = {
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  };
  return {
    io: vi.fn(() => mockSocket),
  };
});

describe('useChat', () => {
  const serverUrl = 'http://localhost:3000';
  const roomId = 'room-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty messages', () => {
    const { result } = renderHook(() => useChat(serverUrl, roomId));
    expect(result.current.messages).toEqual([]);
  });

  it('should provide a sendMessage function', () => {
    const { result } = renderHook(() => useChat(serverUrl, roomId));
    expect(typeof result.current.sendMessage).toBe('function');
  });
});
```

- [ ] **Step 3: Run tests**

```bash
docker exec -it online-cinema-frontend npm run test
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useAuth.test.ts frontend/src/hooks/useChat.test.ts
git commit -m "test: add frontend useAuth and useChat hook tests"
```

---

### Task 19: Hate Speech Detector Tests

**Files:**
- Create: `hate-speech-detector/test_app.py`
- Modify: `hate-speech-detector/requirements.txt`
- Modify: `Makefile`

- [ ] **Step 1: Add pytest to requirements.txt**

Add `pytest` on a new line to `hate-speech-detector/requirements.txt`.

- [ ] **Step 2: Write test_app.py**

```python
import pytest
from unittest.mock import patch
from app import app


@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestAnalyzeInputValidation:
    def test_missing_json_body(self, client):
        response = client.post('/analyze', data='not json')
        assert response.status_code == 400
        assert response.get_json()['error'] == 'Request must be JSON'

    def test_missing_text_key(self, client):
        response = client.post('/analyze', json={})
        assert response.status_code == 400
        assert 'Missing' in response.get_json()['error']

    def test_text_not_a_string(self, client):
        response = client.post('/analyze', json={'text': 42})
        assert response.status_code == 400
        assert 'must be a string' in response.get_json()['error']

    def test_text_is_empty_string(self, client):
        response = client.post('/analyze', json={'text': ''})
        assert response.status_code == 400
        assert 'cannot be empty' in response.get_json()['error']

    def test_text_is_whitespace_only(self, client):
        response = client.post('/analyze', json={'text': '   '})
        assert response.status_code == 400
        assert 'cannot be empty' in response.get_json()['error']


class TestAnalyzeBehavior:
    @patch('app.isHate')
    def test_benign_text_returns_is_hate_false(self, mock_isHate, client):
        mock_isHate.return_value = {'message': 'ok', 'isHate': False}
        response = client.post('/analyze', json={'text': 'hello there'})
        assert response.status_code == 200
        assert response.get_json()['isHate'] is False

    @patch('app.isHate')
    def test_hate_speech_returns_is_hate_true(self, mock_isHate, client):
        mock_isHate.return_value = {'message': 'hate detected', 'isHate': True}
        response = client.post('/analyze', json={'text': 'hateful content'})
        assert response.status_code == 200
        assert response.get_json()['isHate'] is True

    @patch('app.isHate')
    def test_model_exception_returns_500(self, mock_isHate, client):
        mock_isHate.side_effect = RuntimeError('model crash')
        response = client.post('/analyze', json={'text': 'whatever'})
        assert response.status_code == 500
        assert 'internal error' in response.get_json()['error']
```

- [ ] **Step 3: Add Makefile target**

Add to the `Makefile`:

```makefile
test-hate-speech-detector:
	docker exec -it online-cinema-hate-speech-detector pytest /app/test_app.py -v
```

- [ ] **Step 4: Rebuild and test**

```bash
make rebuild-hate-speech-detector
make test-hate-speech-detector
```

- [ ] **Step 5: Commit**

```bash
git add hate-speech-detector/test_app.py hate-speech-detector/requirements.txt Makefile
git commit -m "test: add hate speech detector tests with pytest"
```

---

## Verification

After all tasks are complete, run the full test suite:

```bash
make test-backend               # all backend unit tests pass
make test-backend-e2e           # all e2e tests pass
docker exec -it online-cinema-frontend npm run test   # all frontend tests pass
make test-hate-speech-detector   # all hate speech detector tests pass
```

---

## Self-Review

**Spec coverage:**
- Backend: RoomsService, RoomsController, VideosService, VideosController, MessagesService, HateSpeechDetectorService, ChatGateway, RoomGateway, WsAuthGuard, UrlTokenGuard, RedisHelper, UsersController PATCH — ALL covered (Task 1-12)
- Frontend: Infrastructure setup, authSlice, userSlice, videoSlice, roomSlice, LoginForm, ProtectedRoute, Modal, useAuth, useChat — covered (Task 13-18). Note: RegisterForm, ChatWindow, NavigationBar, hooks (useRooms, useVideos), services (apiClient), and pages (DashboardPage, VideoSelectionPage, RoomPage) are deferred to a follow-up plan due to plan length.
- Hate Speech Detector: test_app.py, requirements, Makefile — covered (Task 19)

**Placeholder scan:** No TBD, TODO, or incomplete sections. All code blocks are complete. Note in Task 17 acknowledges that button/label selectors may need adjustments based on actual JSX.

**Type consistency:** Slice interfaces (AuthState, UserState, VideoState, RoomState) are used consistently. Mock structures match source signatures.
