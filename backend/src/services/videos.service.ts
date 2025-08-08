import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from 'src/entities/video.entity';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as ffmpeg from 'fluent-ffmpeg';
import { Redis } from 'ioredis';

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

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    @Inject('default') private readonly redisClient: Redis,
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

    this.startVideoProcessing(file, savedVideo.id);

    return {
      message: 'Video uploaded successfully',
      videoId: savedVideo.id,
    };
  }

  private async createDirectories() {
    await fs.mkdir(this.tempDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  private async startVideoProcessing(
    file: Express.Multer.File,
    videoId: string,
  ) {
    const inputPath = file.path;
    // Create a dedicated directory for this video's HLS files
    const hlsOutputDir = join(this.outputDir, videoId);
    await fs.mkdir(hlsOutputDir, { recursive: true });

    const manifestPath = join(hlsOutputDir, 'master.m3u8');

    console.log('Set Processing Status');
    await this.redisClient.set(
      videoId,
      JSON.stringify({
        status: 'pending',
        originalFileName: file.originalname,
      }),
    );
    console.log('Finish Set Processing Status');

    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264', // Video codec
        '-c:a aac', // Audio codec
        '-hls_time 10', // Segment duration in seconds
        '-hls_list_size 0', // Keep all segments in the playlist (for VOD)
        '-f hls', // HLS format
      ])
      .output(manifestPath)
      .on('start', async () => {
        await this.redisClient.set(
          videoId,
          JSON.stringify({
            ...(await this.getVideoStatusFromRedis(videoId)),
            status: 'processing',
          }),
        );
        console.log(`FFmpeg HLS process started for ${videoId}`);
      })
      .on('end', async () => {
        await fs.unlink(inputPath);

        await this.redisClient.set(
          videoId,
          JSON.stringify({
            ...(await this.getVideoStatusFromRedis(videoId)),
            status: 'completed',
            processedPath: manifestPath,
          }),
        );
        console.log(`FFmpeg HLS processing finished for ${videoId}`);
      })
      .on('error', async (err) => {
        await fs.unlink(inputPath);
        // Clean up the HLS directory on error
        await fs.rm(hlsOutputDir, { recursive: true, force: true });

        await this.redisClient.set(
          videoId,
          JSON.stringify({
            ...(await this.getVideoStatusFromRedis(videoId)),
            status: 'failed',
            error: err.message,
          }),
        );
        console.error(
          `An error occurred during HLS conversion for ${videoId}:`,
          err.message,
        );
      })
      .run();
  }

  async getVideoStatusFromRedis(
    videoId: string,
  ): Promise<VideoStatus | undefined> {
    const statusJson = await this.redisClient.get(videoId);

    if (!statusJson) {
      return undefined;
    }

    try {
      const statusObject = JSON.parse(statusJson);
      return statusObject;
    } catch (error) {
      console.error(`Failed to parse JSON for videoId: ${videoId}`, error);
      return undefined;
    }
  }

  async getVideoStatus(
    videoId: string,
    userId: string,
  ): Promise<VideoStatus | undefined> {
    const video = await this.videoRepository.findOneBy({
      id: videoId,
      userId,
    });

    if (!video) {
      return undefined;
    }

    return await this.getVideoStatusFromRedis(videoId);
  }
}
