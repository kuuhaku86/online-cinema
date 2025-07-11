import { Injectable } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Repository } from 'typeorm';
import { Video } from 'src/entities/video.entity';

@Injectable()
export class VideosService {
  constructor(
    // Inject RoomService if you need to update room details with video info
    private readonly roomsService: RoomsService,
    private readonly videoRepository: Repository<Video>,
  ) {}

  async handleUpload(file: Express.Multer.File, userId: string) {
    console.log(`Video uploaded by user ${userId}: ${file.path}`);

    // TODO: Save video metadata to the database, associated with the userId.
    const newVideo = this.videoRepository.create({
      userId: userId,
      fileName: file.filename,
    });

    return {
      message: 'Video uploaded successfully',
      videoId: newVideo.id,
    };
  }
}
