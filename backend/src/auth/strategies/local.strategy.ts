import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(
    email: string,
    password: string,
  ): Promise<Omit<User, 'passwordHash' | 'currentHashedRefreshToken'>> {
    console.log(`LocalStrategy: Validating user ${email}`);
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      console.log(`LocalStrategy: Validation failed for user ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    console.log(`LocalStrategy: Validation successful for user ${email}`);
    return user;
  }
}
