import { Injectable } from '@nestjs/common';
import { RoomService } from './room.service';

@Injectable()
export class VideosService {
  constructor(
    // Inject RoomService if you need to update room details with video info
    private readonly roomService: RoomService,
  ) {}

  async handleUpload(
    file: Express.Multer.File,
    userId: string,
  ) {
    console.log(
      `Video uploaded by user ${userId}: ${file.path}`,
    );

    // TODO: Save video metadata to the database, associated with the userId.

    return {
      message: 'Video uploaded successfully',
      videoUrl: `/uploads/videos/${file.filename}`,
    };
  }
}