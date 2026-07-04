import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsAuthGuard } from './ws-auth.guard';
import { Socket } from 'socket.io';

function createMockSocket(token?: string): Partial<Socket> {
  return {
    handshake: { auth: { token } } as any,
    data: {} as any,
    id: 'socket-id',
    rooms: new Set(),
    emit: jest.fn(),
    join: jest.fn(),
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
  let jwtService: any;

  const mockPayload = {
    sub: 'user-uuid',
    username: 'testuser',
    email: 'test@example.com',
  };

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
    expect(socket.data!.user.id).toBe(mockPayload.sub);
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
