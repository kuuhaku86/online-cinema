import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { User } from '../entities/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ParseUUIDPipe } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

const mockUsersService = {
  findOne: jest.fn(),
};

const mockAuthService = {
};

const mockAuthGuard = {
  canActivate: jest.fn(() => true),
};

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: typeof mockUsersService;
  let authService: typeof mockAuthService;

  const mockUserId = 'a-valid-uuid';
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

  const mockUserResult: Omit<
    User,
    'passwordHash' | 'currentHashedRefreshToken'
  > = {
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
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
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
      const nonExistentId = 'non-existent-uuid';
      usersService.findOne.mockRejectedValue(
        new NotFoundException(`User with ID "${nonExistentId}" not found`),
      );

      await expect(controller.getUser(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
      expect(usersService.findOne).toHaveBeenCalledWith(nonExistentId);
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
});
