import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/users/create-user.dto';
import { UpdateUserDto } from '../dto/users/update-user.dto';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

type MockRepository<T = any> = Partial<
  Record<keyof Repository<User>, jest.Mock>
>;

const createMockRepository = (): MockRepository<User> => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  preload: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockRepository<User>;

  const mockUser: User = {
    id: 'some-uuid',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashedPassword123',
    currentHashedRefreshToken: 'hashedPassword123',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateUserDto: CreateUserDto = {
    username: 'newuser',
    email: 'new@example.com',
    password: 'Password123!',
    name: 'New User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<MockRepository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a user', async () => {
      userRepository.findOne!.mockResolvedValue(null);
      userRepository.create!.mockReturnValue({
        ...mockUser,
        ...mockCreateUserDto,
        passwordHash: 'hashedPassword123',
      });
      userRepository.save!.mockResolvedValue({
        ...mockUser,
        ...mockCreateUserDto,
        passwordHash: 'hashedPassword123',
      });

      const result = await service.create(mockCreateUserDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: mockCreateUserDto.email },
          { username: mockCreateUserDto.username },
        ],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        username: mockCreateUserDto.username,
        email: mockCreateUserDto.email,
        name: mockCreateUserDto.name,
        passwordHash: 'hashedPassword123',
      });
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: 'hashedPassword123' }),
      );
      expect(result).toBeDefined();
      expect(result.username).toEqual(mockCreateUserDto.username);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw BadRequestException if username or email already exists', async () => {
      userRepository.findOne!.mockResolvedValue(mockUser);

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on save error', async () => {
      userRepository.findOne!.mockResolvedValue(null);
      userRepository.create!.mockReturnValue({
        ...mockUser,
        ...mockCreateUserDto,
        passwordHash: 'hashedPassword123',
      });
      userRepository.save!.mockRejectedValue(new Error('Database error'));

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException on hash error', async () => {
      userRepository.findOne!.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const usersArray = [
        mockUser,
        {
          ...mockUser,
          id: 'uuid-2',
          email: 'test2@example.com',
          username: 'testuser2',
        },
      ];
      userRepository.find!.mockResolvedValue(usersArray);

      const result = await service.findAll();

      expect(userRepository.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(usersArray);
    });
  });

  describe('findOne', () => {
    it('should return a single user by ID', async () => {
      userRepository.findOneBy!.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        id: mockUser.id,
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOneBy!.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        id: 'non-existent-id',
      });
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      userRepository.findOneBy!.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        email: mockUser.email,
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found by email', async () => {
      userRepository.findOneBy!.mockResolvedValue(null);

      const result = await service.findByEmail('non-existent@example.com');

      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        email: 'non-existent@example.com',
      });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateDtoWithName: UpdateUserDto = { name: 'Updated Name' };
    const updateDtoWithPass: UpdateUserDto = { password: 'NewPassword123!' };
    const updateDtoWithBoth: UpdateUserDto = {
      name: 'Updated Name Again',
      password: 'AnotherPassword123!',
    };

    it('should successfully update user data (without password)', async () => {
      const preloadedUser = { ...mockUser };
      const expectedSavedUser = {
        ...mockUser,
        name: updateDtoWithName.name,
        updatedAt: new Date(),
      };

      userRepository.preload!.mockResolvedValue(preloadedUser);
      userRepository.save!.mockResolvedValue(expectedSavedUser);

      const result = await service.update(mockUser.id, updateDtoWithName);

      expect(userRepository.preload).toHaveBeenCalledWith({
        id: mockUser.id,
        ...updateDtoWithName,
      });
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(preloadedUser);
      expect(result).toEqual(
        expect.objectContaining({ name: updateDtoWithName.name }),
      );
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should successfully update user data (with password)', async () => {
      const preloadedUser = { ...mockUser };
      const expectedSavedUser = {
        ...mockUser,
        passwordHash: 'newHashedPassword',
        updatedAt: new Date(),
      };
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

      userRepository.preload!.mockResolvedValue(preloadedUser);
      userRepository.save!.mockResolvedValue(expectedSavedUser);

      const result = await service.update(mockUser.id, updateDtoWithPass);

      expect(userRepository.preload).toHaveBeenCalledWith({ id: mockUser.id });
      expect(bcrypt.hash).toHaveBeenCalledWith(updateDtoWithPass.password, 10);
      expect(preloadedUser.passwordHash).toEqual('newHashedPassword');
      expect(userRepository.save).toHaveBeenCalledWith(preloadedUser);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should successfully update user data (with name and password)', async () => {
      const preloadedUser = { ...mockUser };
      const expectedSavedUser = {
        ...mockUser,
        name: updateDtoWithBoth.name,
        passwordHash: 'anotherHashedPassword',
        updatedAt: new Date(),
      };
      (bcrypt.hash as jest.Mock).mockResolvedValue('anotherHashedPassword');

      userRepository.preload!.mockResolvedValue(preloadedUser);
      userRepository.save!.mockResolvedValue(expectedSavedUser);

      const result = await service.update(mockUser.id, updateDtoWithBoth);

      expect(userRepository.preload).toHaveBeenCalledWith({
        id: mockUser.id,
        name: updateDtoWithBoth.name,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(updateDtoWithBoth.password, 10);
      expect(preloadedUser.passwordHash).toEqual('anotherHashedPassword');
      expect(preloadedUser.name).toEqual(mockUser.name);
      expect(userRepository.save).toHaveBeenCalledWith(preloadedUser);
      expect(result).toEqual(
        expect.objectContaining({ name: updateDtoWithBoth.name }),
      );
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException if user to update is not found', async () => {
      userRepository.preload!.mockResolvedValue(null);

      await expect(
        service.update(mockUser.id, updateDtoWithName),
      ).rejects.toThrow(NotFoundException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException on unique constraint error during update', async () => {
      const preloadedUser = { ...mockUser };
      userRepository.preload!.mockResolvedValue(preloadedUser);
      userRepository.save!.mockRejectedValue({ code: '23505' });

      await expect(
        service.update(mockUser.id, { email: 'existing@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on general save error during update', async () => {
      const preloadedUser = { ...mockUser };
      userRepository.preload!.mockResolvedValue(preloadedUser);
      userRepository.save!.mockRejectedValue(new Error('Some other DB error'));

      await expect(
        service.update(mockUser.id, updateDtoWithName),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('should successfully remove a user', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      userRepository.remove!.mockResolvedValue(undefined);

      await service.remove(mockUser.id);

      expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user to remove is not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('setCurrentRefreshToken', () => {
    const userId = mockUser.id;
    const hashedToken = 'newHashedRefreshToken';

    it('should successfully update the refresh token hash', async () => {
      const mockUpdateResult: UpdateResult = {
        affected: 1,
        raw: [],
        generatedMaps: [],
      };
      userRepository.update!.mockResolvedValue(mockUpdateResult);

      await expect(
        service.setCurrentRefreshToken(userId, hashedToken),
      ).resolves.toBeUndefined();

      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        currentHashedRefreshToken: hashedToken,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockUpdateResult: UpdateResult = {
        affected: 0,
        raw: [],
        generatedMaps: [],
      };
      userRepository.update!.mockResolvedValue(mockUpdateResult);

      await expect(
        service.setCurrentRefreshToken(userId, hashedToken),
      ).rejects.toThrow(NotFoundException);
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        currentHashedRefreshToken: hashedToken,
      });
    });

    it('should throw InternalServerErrorException on database error', async () => {
      userRepository.update!.mockRejectedValue(
        new Error('DB connection error'),
      );

      await expect(
        service.setCurrentRefreshToken(userId, hashedToken),
      ).rejects.toThrow(InternalServerErrorException);
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        currentHashedRefreshToken: hashedToken,
      });
    });
  });

  describe('removeRefreshToken', () => {
    const userId = mockUser.id;

    it('should successfully remove the refresh token and return the user', async () => {
      const mockUpdateResult: UpdateResult = {
        affected: 1,
        raw: [],
        generatedMaps: [],
      };
      const updatedUser = { ...mockUser, currentHashedRefreshToken: null };

      userRepository.update!.mockResolvedValue(mockUpdateResult);
      jest.spyOn(service, 'findOne').mockResolvedValue(updatedUser);

      const result = await service.removeRefreshToken(userId);

      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        currentHashedRefreshToken: null,
      });
      expect(service.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(updatedUser);
    });

    it('should return null if user not found during update', async () => {
      const mockUpdateResult: UpdateResult = {
        affected: 0,
        raw: [],
        generatedMaps: [],
      };
      userRepository.update!.mockResolvedValue(mockUpdateResult);
      jest.spyOn(service, 'findOne');

      const result = await service.removeRefreshToken(userId);

      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        currentHashedRefreshToken: null,
      });
      expect(service.findOne).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should throw InternalServerErrorException on update error', async () => {
      userRepository.update!.mockRejectedValue(
        new Error('DB connection error'),
      );
      jest.spyOn(service, 'findOne');

      await expect(service.removeRefreshToken(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        currentHashedRefreshToken: null,
      });
      expect(service.findOne).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if findOne fails after successful update', async () => {
      const mockUpdateResult: UpdateResult = {
        affected: 1,
        raw: [],
        generatedMaps: [],
      };
      userRepository.update!.mockResolvedValue(mockUpdateResult);
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new Error('Find failed'));

      await expect(service.removeRefreshToken(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        currentHashedRefreshToken: null,
      });
      expect(service.findOne).toHaveBeenCalledWith(userId);
    });
  });
});
