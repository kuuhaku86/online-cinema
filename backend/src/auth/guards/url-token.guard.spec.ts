import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UrlTokenGuard } from './url-token.guard';

function createMockExecutionContext(token?: string): any {
  const request: any = { params: { token } };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  };
}

describe('UrlTokenGuard', () => {
  let guard: UrlTokenGuard;
  let jwtService: any;

  const mockPayload = {
    userId: 'user-uuid',
    roomId: 'room-uuid',
    videoId: 'video-uuid',
  };

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
    const req = ctx.switchToHttp().getRequest();
    expect(req.payload).toEqual(mockPayload);
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
