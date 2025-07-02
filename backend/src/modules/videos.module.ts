import { Module } from '@nestjs/common';
import { VideosController } from '../controllers/videos.controller';
import { VideosService } from '../services/videos.service';
import { AuthModule } from './auth.module';
import { RoomsModule } from './rooms.module';

@Module({
  imports: [AuthModule, RoomsModule],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
