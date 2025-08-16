import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class StartRoomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly video_id: string;
}
