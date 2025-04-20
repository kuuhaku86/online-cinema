import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import {
  JwtRefreshStrategy,
  UserWithRefreshToken,
} from './jwt-refresh.strategy';
import { Request } from 'express';

interface RefreshTokenPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;

  const mockUserId = 'user-uuid-refresh';
  const mockRefreshToken = 'some-valid-refresh-token-string';

  const validPayload: RefreshTokenPayload = {
    sub: mockUserId,
    iat: Date.now() / 1000,
    exp: Date.now() / 1000 + 3600,
  };

  // Mock Express Request object
  const createMockRequest = (body?: any): Request => {
    return {
      body: body,
    } as Request;
  };

  beforeAll(() => {
    if (!process.env.JWT_REFRESH_SECRET) {
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
      console.warn(
        'JWT_REFRESH_SECRET was not set. Using a default for testing.',
      );
    }
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtRefreshStrategy],
    }).compile();

    strategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user ID and refresh token when validation is successful', async () => {
      const mockRequest = createMockRequest({
        refresh_token: mockRefreshToken,
      });
      const expectedResult: UserWithRefreshToken = {
        userId: mockUserId,
        refreshToken: mockRefreshToken,
      };

      const result = await strategy.validate(mockRequest, validPayload);

      expect(result).toEqual(expectedResult);
    });

    it('should throw UnauthorizedException if refresh token is missing in request body', async () => {
      const mockRequest = createMockRequest({});

      await expect(
        strategy.validate(mockRequest, validPayload),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        strategy.validate(mockRequest, validPayload),
      ).rejects.toThrow('Invalid refresh token or payload');
    });

    it('should throw UnauthorizedException if payload is null or undefined', async () => {
      const mockRequest = createMockRequest({
        refresh_token: mockRefreshToken,
      });

      await expect(strategy.validate(mockRequest, null as any)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(
        strategy.validate(mockRequest, undefined as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if payload is missing "sub" property', async () => {
      const mockRequest = createMockRequest({
        refresh_token: mockRefreshToken,
      });
      const invalidPayload = { iat: Date.now() / 1000 };

      await expect(
        strategy.validate(mockRequest, invalidPayload as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if payload "sub" is null or undefined', async () => {
      const mockRequest = createMockRequest({
        refresh_token: mockRefreshToken,
      });
      const invalidPayloadSubNull = { ...validPayload, sub: null as any };
      const invalidPayloadSubUndefined = {
        ...validPayload,
        sub: undefined as any,
      };

      await expect(
        strategy.validate(mockRequest, invalidPayloadSubNull),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        strategy.validate(mockRequest, invalidPayloadSubUndefined),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
