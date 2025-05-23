import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ParseUUIDPipe,
  UseGuards,
  Patch,
  Body,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { User } from '../entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from '../dto/users/update-user.dto';
import { Request } from 'express';

// This interface should ideally be in a shared types file.
// It's based on the one in auth.controller.ts and assumes JWT strategy populates req.user similarly.
interface RequestWithAuthenticatedUser extends Request {
  user: Omit<User, 'passwordHash' | 'currentHashedRefreshToken'> & { id: string };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Omit<User, 'passwordHash' | 'currentHashedRefreshToken'>> {
    console.log(`Fetching user with ID: ${id}`);
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, currentHashedRefreshToken, ...result } = user;
    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async updateUserProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithAuthenticatedUser,
  ): Promise<Omit<User, 'passwordHash' | 'currentHashedRefreshToken'>> {
    // Ensure the authenticated user is the one being updated
    if (req.user.id !== id) {
      throw new ForbiddenException('You are not authorized to update this profile.');
    }

    console.log(`Updating profile for user ID: ${id} with data:`, updateUserDto);
    // The usersService.update method needs to be implemented.
    // It should handle finding the user by id, updating fields, and saving.
    // It should throw NotFoundException if the user isn't found.
    const updatedUser = await this.usersService.update(id, updateUserDto);

    return updatedUser;
  }
}
