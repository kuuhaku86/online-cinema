import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../../services/auth.service';
import { User } from '../../entities/user.entity';

const mockAuthService = {
  validateUser: jest.fn(),
};

const mockUserResult: Omit<User, 'passwordHash' | 'currentHashedRefreshToken'> =
  {
    id: 'user-uuid-1',
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    videos: [],
    messages: [],
  };

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: typeof mockAuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const testEmail = 'test@example.com';
    const testPassword = 'password123';

    it('should return the user object (without password) when validation is successful', async () => {
      authService.validateUser.mockResolvedValue(mockUserResult);

      const result = await strategy.validate(testEmail, testPassword);

      expect(authService.validateUser).toHaveBeenCalledWith(
        testEmail,
        testPassword,
      );
      expect(result).toEqual(mockUserResult);
    });

    it('should throw UnauthorizedException when validation fails (user not found or wrong password)', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(testEmail, testPassword)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(authService.validateUser).toHaveBeenCalledWith(
        testEmail,
        testPassword,
      );
    });

    it('should propagate other errors thrown by authService.validateUser', async () => {
      const genericError = new Error('Database connection error');
      authService.validateUser.mockRejectedValue(genericError);

      await expect(strategy.validate(testEmail, testPassword)).rejects.toThrow(
        genericError,
      );

      expect(authService.validateUser).toHaveBeenCalledWith(
        testEmail,
        testPassword,
      );
    });
  });
});
