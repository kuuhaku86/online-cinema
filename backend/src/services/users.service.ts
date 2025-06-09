import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/users/create-user.dto';
import { UpdateUserDto } from '../dto/users/update-user.dto';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => AuthService)) // Use forwardRef for AuthService injection
    private readonly authService: AuthService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new InternalServerErrorException('Error processing password.');
    }
  }

  async create(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'passwordHash' | 'currentHashedRefreshToken'>> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });
    if (existingUser) {
      throw new ConflictException('Username or email already exists.');
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);

    const userData = {
      ...createUserDto,
      passwordHash: hashedPassword,
    };

    delete (userData as any).password;

    const newUser = this.userRepository.create(userData);

    try {
      const savedUser = await this.userRepository.save(newUser);
      const { passwordHash, currentHashedRefreshToken, ...userData } =
        savedUser;
      return userData;
    } catch (error) {
      console.error('Error saving user:', error);
      throw new InternalServerErrorException('Could not create user.');
    }
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'passwordHash' | 'currentHashedRefreshToken'>> {
    const updateData = { ...updateUserDto };
    let hashedPassword: string | undefined = undefined;

    if (updateData.newPassword) {
      const user = await this.authService.validateUser(updateData.email, updateData.oldPassword);
      if (!user) {
        console.log(`Update: Validation failed for user ${updateData.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      hashedPassword = await this.hashPassword(updateData.newPassword);
      delete (updateData as any).newPassword;
      delete (updateData as any).oldPassword;
    }

    const user = await this.userRepository.preload({
      id: id,
      ...updateData,
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    if (hashedPassword) {
      user.passwordHash = hashedPassword;
    }

    try {
      const savedUser = await this.userRepository.save(user);
      const { passwordHash, currentHashedRefreshToken, ...userData } =
        savedUser;
      return userData;
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Username or email already exists.');
      }
      console.error('Error updating user:', error);
      throw new InternalServerErrorException('Could not update user.');
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async setCurrentRefreshToken(
    userId: string,
    hashedRefreshToken: string,
  ): Promise<void> {
    try {
      const updateResult = await this.userRepository.update(userId, {
        currentHashedRefreshToken: hashedRefreshToken,
      });

      if (updateResult.affected === 0) {
        throw new NotFoundException(
          `User with ID "${userId}" not found for refresh token update.`,
        );
      }
      console.log(`Refresh token updated for user ID: ${userId}`); // Optional logging
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error setting refresh token:', error);
      throw new InternalServerErrorException('Could not update refresh token.');
    }
  }

  async removeRefreshToken(userId: string): Promise<User | null> {
    try {
      const updateResult = await this.userRepository.update(userId, {
        currentHashedRefreshToken: null,
      });

      if (updateResult.affected === 0) {
        console.warn(
          `User with ID "${userId}" not found during refresh token removal.`,
        );
        return null;
      }

      console.log(`Refresh token removed for user ID: ${userId}`);
      const updatedUser = await this.findOne(userId);
      return updatedUser;
    } catch (error) {
      console.error('Error removing refresh token:', error);
      throw new InternalServerErrorException('Could not remove refresh token.');
    }
  }
}
