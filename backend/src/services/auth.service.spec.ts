import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';

jest.mock('bcrypt');

const mockUsersService = {
  findByEmail: jest.fn(),
  findOne: jest.fn(),
  setCurrentRefreshToken: jest.fn(),
  removeRefreshToken: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: typeof mockUsersService;
  let jwtService: typeof mockJwtService;

  const mockUser: User = {
    id: 'user-uuid-1',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashedPassword123',
    currentHashedRefreshToken: 'hashedRefreshToken123',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithoutSensitiveData: Omit<
    User,
    'passwordHash' | 'currentHashedRefreshToken'
  > = {
    id: 'user-uuid-1',
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedToken');
    jwtService.signAsync.mockResolvedValue('mockToken');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data without password hash if validation succeeds', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        mockUser.email,
        'correctPassword',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctPassword',
        mockUser.passwordHash,
      );
      expect(result).toEqual(mockUserWithoutSensitiveData);
    });

    it('should return null if user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'anyPassword',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        mockUser.email,
        'wrongPassword',
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongPassword',
        mockUser.passwordHash,
      );
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens and update refresh token hash', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('mockAccessToken')
        .mockResolvedValueOnce('mockRefreshToken');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedMockRefreshToken');

      const result = await service.login(mockUserWithoutSensitiveData);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_EXPIRATION,
        },
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: process.env.JWT_REFRESH_EXPIRATION,
        },
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('mockRefreshToken', 10);
      expect(usersService.setCurrentRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        'hashedMockRefreshToken',
      );
      expect(result).toEqual({
        access_token: 'mockAccessToken',
        email: mockUser.email,
        id: mockUser.id,
        username: mockUser.username,
        refresh_token: 'mockRefreshToken',
      });
    });
  });

  describe('refreshToken', () => {
    const currentRefreshToken = 'validRefreshToken';

    it('should return new tokens if refresh token is valid', async () => {
      usersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('newMockAccessToken')
        .mockResolvedValueOnce('newMockRefreshToken');
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedRefreshToken');

      const result = await service.refreshToken(
        mockUser.id,
        currentRefreshToken,
      );

      expect(usersService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        currentRefreshToken,
        mockUser.currentHashedRefreshToken,
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith('newMockRefreshToken', 10);
      expect(usersService.setCurrentRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        'newHashedRefreshToken',
      );
      expect(result).toEqual({
        access_token: 'newMockAccessToken',
        refresh_token: 'newMockRefreshToken',
      });
    });

    it('should throw ForbiddenException if user is not found', async () => {
      usersService.findOne.mockResolvedValue(null);

      await expect(
        service.refreshToken(mockUser.id, currentRefreshToken),
      ).rejects.toThrow(ForbiddenException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user has no stored refresh token', async () => {
      const userWithoutToken = { ...mockUser, currentHashedRefreshToken: null };
      usersService.findOne.mockResolvedValue(userWithoutToken);

      await expect(
        service.refreshToken(mockUser.id, currentRefreshToken),
      ).rejects.toThrow(ForbiddenException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if refresh token does not match', async () => {
      usersService.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.refreshToken(mockUser.id, 'invalidRefreshToken'),
      ).rejects.toThrow(ForbiddenException);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'invalidRefreshToken',
        mockUser.currentHashedRefreshToken,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(usersService.setCurrentRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should remove refresh token and return user data', async () => {
      const userAfterLogout = {
        ...mockUser,
        currentHashedRefreshToken: null,
      };
      usersService.removeRefreshToken.mockResolvedValue(userAfterLogout);

      const result = await service.logout(mockUser.id);

      expect(usersService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUserWithoutSensitiveData);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('currentHashedRefreshToken');
    });

    it('should return null if removeRefreshToken returns null (user not found or token already removed)', async () => {
      usersService.removeRefreshToken.mockResolvedValue(null);

      const result = await service.logout(mockUser.id);

      expect(usersService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toBeNull();
    });
  });

  describe('updateRefreshTokenHash (private method test via public methods)', () => {
    it('should call bcrypt.hash and usersService.setCurrentRefreshToken (tested via login)', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('accessToken')
        .mockResolvedValueOnce('refreshTokenToHash');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedToken');

      await service.login(mockUserWithoutSensitiveData);

      expect(bcrypt.hash).toHaveBeenCalledWith('refreshTokenToHash', 10);
      expect(usersService.setCurrentRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        'hashedToken',
      );
    });
  });
});
