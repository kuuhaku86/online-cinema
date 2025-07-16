import { Module } from '@nestjs/common';
import { VideosController } from '../controllers/videos.controller';
import { VideosService } from '../services/videos.service';
import { AuthModule } from './auth.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Video } from 'src/entities/video.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Video]),
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
