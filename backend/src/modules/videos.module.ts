import { Module } from '@nestjs/common';
import { VideosController } from '../controllers/videos.controller';
import { VideosService } from '../services/videos.service';
import { AuthModule } from './auth.module';
import { RoomsModule } from './rooms.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Module({
  imports: [
    AuthModule,
    RoomsModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const filename = `${Date.now()}-${file.originalname}`;
          cb(null, filename);
        },
      }),
    }),
  ],
  controllers: [VideosController],
  providers: [VideosService],
})
export class VideosModule {}
