import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from 'src/entities/video.entity';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  async handleUpload(file: Express.Multer.File, userId: string) {
    console.log(`Video uploaded by user ${userId}: ${file.path}`);

    if (!file) {
      throw new BadRequestException('no file uploaded');
    }

    // validate file type
    const allowedMimeTypes = [
      'video/mp4',
      'video/webm',
      'video/x-msvideo',
      'video/x-matroska',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('invalid file type');
    }

    // validate file size (e.g., max 500mb)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('file is too large!');
    }

    const newVideo = this.videoRepository.create({
      userId: userId,
      fileName: file.filename,
    });

    const savedVideo = await this.videoRepository.save(newVideo);

    return {
      message: 'Video uploaded successfully',
      videoId: savedVideo.id,
    };
  }
}
