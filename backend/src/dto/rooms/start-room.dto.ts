import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class StartRoomDto {
  @Expose({ name: 'video_id' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly videoId: string;
}
