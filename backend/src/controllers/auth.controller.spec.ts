import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../services/users.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from '../dto/users/create-user.dto';

const mockAuthService = {
  login: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
};

const mockUsersService = {
  create: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockUserFromRequest = {
  id: 'user-uuid-req',
  username: 'reqUser',
  email: 'req@example.com',
  name: 'Request User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUserPayload = {
  id: 'user-uuid-payload',
  refreshToken: 'some-refresh-token',
};

const mockCreateUserDto: CreateUserDto = {
  username: 'newuser',
  email: 'new@example.com',
  password: 'Password123!',
};

const mockCreatedUser = {
  id: 'new-user-uuid',
  username: 'newuser',
  email: 'new@example.com',
  name: 'New User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTokens = {
  access_token: 'mockAccessToken',
  refresh_token: 'mockRefreshToken',
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: typeof mockAuthService;
  let usersService: typeof mockUsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    })
      .overrideGuard(AuthGuard('local'))
      .useValue(mockAuthGuard)
      .overrideGuard(AuthGuard('jwt-refresh'))
      .useValue(mockAuthGuard)
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call usersService.create and return the created user', async () => {
      usersService.create.mockResolvedValue(mockCreatedUser);

      const result = await controller.register(mockCreateUserDto);

      expect(usersService.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual(mockCreatedUser);
    });

    it('should handle errors from usersService.create', async () => {
      const error = new Error('Failed to create user');
      usersService.create.mockRejectedValue(error);

      await expect(controller.register(mockCreateUserDto)).rejects.toThrow(
        error,
      );
      expect(usersService.create).toHaveBeenCalledWith(mockCreateUserDto);
    });
  });

  describe('login', () => {
    it('should call authService.login with user from request and return tokens', async () => {
      authService.login.mockResolvedValue(mockTokens);
      const mockRequest = { user: mockUserFromRequest } as any;

      const result = await controller.login(mockRequest);

      expect(authService.login).toHaveBeenCalledWith(mockUserFromRequest);
      expect(result).toEqual(mockTokens);
    });
  });

  describe('refreshToken', () => {
    it('should call authService.refreshToken with user ID and token from request and return new tokens', async () => {
      authService.refreshToken.mockResolvedValue(mockTokens);
      const mockRequest = { user: mockUserPayload } as any;

      const result = await controller.refreshToken(mockRequest);

      expect(authService.refreshToken).toHaveBeenCalledWith(
        mockUserPayload.id,
        mockUserPayload.refreshToken,
      );
      expect(result).toEqual(mockTokens);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with user ID from request and return success message', async () => {
      authService.logout.mockResolvedValue(undefined);
      const mockRequest = { user: mockUserFromRequest } as any;

      const result = await controller.logout(mockRequest);

      expect(authService.logout).toHaveBeenCalledWith(mockUserFromRequest.id);
      expect(result).toEqual({
        message: `Logout successful for user ${mockUserFromRequest.id}. Implement logout logic in AuthService.`,
      });
    });
  });
});
