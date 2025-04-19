import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../services/users.service';
import { User } from '../../entities/user.entity';

const mockUsersService = {
  findOne: jest.fn(),
};

const mockUser: User = {
  id: 'user-uuid-1',
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: 'hashedPassword123',
  currentHashedRefreshToken: null,
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

const validPayload: JwtPayload = {
  sub: mockUser.id,
  username: mockUser.username,
  email: mockUser.email,
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: typeof mockUsersService;

  beforeAll(() => {
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'test-secret';
    }
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return the payload if user exists', async () => {
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(validPayload);

      expect(usersService.findOne).toHaveBeenCalledWith(validPayload.sub);
      expect(result).toEqual(validPayload);
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      usersService.findOne.mockResolvedValue(null);

      await expect(strategy.validate(validPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOne).toHaveBeenCalledWith(validPayload.sub);
    });

    it('should throw UnauthorizedException if payload is null', async () => {
      await expect(strategy.validate(null as any)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if payload is missing "sub"', async () => {
      const invalidPayload = { username: 'test', email: 'test@test.com' };

      await expect(strategy.validate(invalidPayload as any)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if payload "sub" is null or undefined', async () => {
      const invalidPayload = { ...validPayload, sub: null as any };

      await expect(strategy.validate(invalidPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOne).not.toHaveBeenCalled();
    });
  });
});
