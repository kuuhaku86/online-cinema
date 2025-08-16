import { Expose } from 'class-transformer';
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
  @Expose({ name: 'video_id' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly videoId: string;
}
