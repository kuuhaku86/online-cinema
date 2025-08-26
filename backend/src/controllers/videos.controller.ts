import {
  Controller,
  Post,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Param,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VideosService } from '../services/videos.service';
import { User } from '../entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { join } from 'path';
import { RoomsService } from 'src/services/rooms.service';
import { UrlTokenGuard } from 'src/auth/guards/url-token.guard';

interface RequestWithAuthenticatedUser extends Request {
  user: Pick<User, 'id'>;
}

interface RequestWithAuthenticatedPayloadForUrl extends Request {
  payload: {
    userId: string;
    roomShortCode: string;
    videoId: string;
  };
}

@Controller('videos')
export class VideosController {
  constructor(
    private readonly videosService: VideosService,
    private readonly roomsService: RoomsService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @Get()
  async getVideos(@Req() req: RequestWithAuthenticatedUser) {
    const currentUser = req.user;
    return this.videosService.getVideos(currentUser.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithAuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('Video file is required.');
    }
    const currentUser = req.user;
    return this.videosService.handleUpload(file, currentUser.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('status/:videoId')
  @HttpCode(HttpStatus.OK)
  async getVideoStatus(
    @Param('videoId') videoId: string,
    @Req() req: RequestWithAuthenticatedUser,
  ) {
    const currentUser = req.user;
    const status = await this.videosService.getVideoStatus(
      videoId,
      currentUser.id,
    );
    if (!status) {
      throw new NotFoundException('Video ID not found.');
    }
    return status;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('stream-detail/:roomShortCode/:videoId')
  async streamDetail(
    @Param('roomShortCode') roomShortCode: string,
    @Param('videoId') videoId: string,
    @Req() req: RequestWithAuthenticatedUser,
  ) {
    const currentUser = req.user;

    const hasAccess = await this.roomsService.checkUserAccessToRoomAndVideo(
      roomShortCode,
      videoId,
      currentUser.id,
    );

    if (!hasAccess) {
      throw new NotFoundException('Video not found or access denied.');
    }

    const streamDetail = await this.videosService.getStreamDetail(
      currentUser.id,
      roomShortCode,
      videoId,
    );

    if (!streamDetail) {
      throw new NotFoundException('Video not found.');
    }

    return streamDetail;
  }

  @UseGuards(UrlTokenGuard)
  @Get('stream/:token/:roomShortCode/:videoId/:file')
  async streamFile(
    @Param('roomShortCode') roomShortCode: string,
    @Param('videoId') videoId: string,
    @Param('file') file: string,
    @Req() req: RequestWithAuthenticatedPayloadForUrl,
    @Res() res: Response,
  ) {
    if (!file.endsWith('.m3u8') && !file.endsWith('.ts')) {
      throw new BadRequestException('Unsupported file type.');
    }

    const hasAccess = await this.roomsService.checkUserAccessToRoomAndVideo(
      roomShortCode,
      videoId,
      req.payload.userId,
    );

    if (!hasAccess) {
      throw new NotFoundException('Video not found or access denied.');
    }

    if (file.includes('..')) {
      throw new BadRequestException('Invalid file path.');
    }

    const filePath = join(process.cwd(), 'uploads', videoId, file);

    if (file.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (file.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/MP2T');
    }

    res.sendFile(filePath);
  }
}
