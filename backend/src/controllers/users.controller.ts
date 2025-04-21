import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { User } from '../entities/user.entity';
import { AuthGuard } from '@nestjs/passport';

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
}
