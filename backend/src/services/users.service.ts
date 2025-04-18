import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/users/create-user.dto';
import { UpdateUserDto } from '../dto/users/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
  ): Promise<Omit<User, 'passwordHash'>> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });
    if (existingUser) {
      throw new BadRequestException('Username or email already exists.');
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
      const { passwordHash, ...userData } = savedUser;
      return savedUser;
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
  ): Promise<Omit<User, 'passwordHash'>> {
    const updateData = { ...updateUserDto };
    let hashedPassword: string | undefined = undefined;

    if (updateData.password) {
      hashedPassword = await this.hashPassword(updateData.password);
      delete (updateData as any).password;
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
      const { passwordHash, ...userData } = savedUser;
      return savedUser;
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
}
