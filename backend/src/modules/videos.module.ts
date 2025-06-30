import { Module } from '@nestjs/common';
import { VideosController } from '../controllers/videos.controller';
import { VideosService } from '../services/videos.service';
import { AuthModule } from './auth.module';
import { RoomModule } from './room.module';

@Module({
  imports: [AuthModule, RoomModule],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}

