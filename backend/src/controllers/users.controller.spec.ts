import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { AuthService } from '../services/auth.service';
import { User } from '../entities/user.entity';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ParseUUIDPipe } from '@nestjs/common';

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
    createdAt: new Date(),
    updatedAt: new Date(),
    videos: [],
    messages: [],
  };

  const mockUserResult: Omit<
    User,
    'passwordHash' | 'currentHashedRefreshToken'
  > = {
    id: mockUserId,
    username: 'testuser',
    email: 'test@example.com',
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
    videos: [],
    messages: [],
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

      await expect(controller.getUser(nonExistentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for an invalid UUID', async () => {
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
    const updateDto = {
      username: 'newuser',
      email: 'new@example.com',
      oldPassword: '',
      newPassword: '',
    };

    it('should update profile when authenticated user matches the target', async () => {
      const updatedUser = {
        ...mockUserResult,
        username: 'newuser',
        email: 'new@example.com',
      };
      usersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateUserProfile(
        mockUserId,
        updateDto,
        mockRequest(mockUserId),
      );

      expect(usersService.update).toHaveBeenCalledWith(mockUserId, updateDto);
      expect(result).toEqual(updatedUser);
    });

    it('should throw ForbiddenException when updating another user', async () => {
      await expect(
        controller.updateUserProfile(
          mockUserId,
          updateDto,
          mockRequest('different-uuid'),
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(usersService.update).not.toHaveBeenCalled();
    });

    it('should propagate NotFoundException from service', async () => {
      usersService.update.mockRejectedValue(new NotFoundException());

      await expect(
        controller.updateUserProfile(
          mockUserId,
          updateDto,
          mockRequest(mockUserId),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
