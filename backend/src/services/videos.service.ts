import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from 'src/entities/video.entity';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as ffmpeg from 'fluent-ffmpeg';

type VideoStatus = {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  originalFileName?: string | undefined;
  processedPath?: string;
  error?: string;
};

@Injectable()
export class VideosService {
  private readonly tempDir = join(process.cwd(), 'temp');
  private readonly outputDir = join(process.cwd(), 'uploads');
  private readonly processingStatus: Map<string, VideoStatus> = new Map();

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {
    this.createDirectories();
  }

  async getVideos(userId: string): Promise<Video[]> {
    return this.videoRepository.find({
      where: { userId },
    });
  }

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

  private async createDirectories() {
    await fs.mkdir(this.tempDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  async startVideoProcessing(file: Express.Multer.File): Promise<string> {
    const videoId = uuidv4();
    const inputPath = file.path;
    const outputFileName = `${file.filename.split('.')[0]}.mp4`;
    const outputPath = join(this.outputDir, outputFileName);

    this.processingStatus.set(videoId, {
      status: 'pending',
      originalFileName: file.originalname,
    });

    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .on('start', () => {
        this.processingStatus.set(videoId, {
          ...this.processingStatus.get(videoId),
          status: 'processing',
        });
        console.log(`FFmpeg process started for ${videoId}`);
      })
      .on('end', async () => {
        await fs.unlink(inputPath);
        this.processingStatus.set(videoId, {
          ...this.processingStatus.get(videoId),
          status: 'completed',
          processedPath: outputPath,
        });
        console.log(`FFmpeg processing finished for ${videoId}`);
      })
      .on('error', async (err) => {
        await fs.unlink(inputPath);
        this.processingStatus.set(videoId, {
          ...this.processingStatus.get(videoId),
          status: 'failed',
          error: err.message,
        });
        console.error(`An error occurred for ${videoId}:`, err.message);
      })
      .run();

    return videoId;
  }

  getVideoStatus(videoId: string, userId: string): VideoStatus | undefined {
    const video = this.videoRepository.find({
      where: { id: videoId, userId },
    });

    if (!video) {
      return undefined;
    }

    return this.processingStatus.get(videoId);
  }
}
