import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly username: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).{6,}$/, {
    message:
      'Password must be at least 6 characters long and contain at least one letter and one number',
  })
  readonly oldPassword: string;

  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).{6,}$/, {
    message:
      'Password must be at least 6 characters long and contain at least one letter and one number',
  })
  readonly newPassword: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  readonly name?: string;
}
