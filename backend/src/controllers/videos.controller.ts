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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VideosService } from '../services/videos.service';
import { User } from '../entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';

interface RequestWithAuthenticatedUser extends Request {
  user: Pick<User, 'id'>;
}

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

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
  getVideoStatus(
    @Param('videoId') videoId: string,
    @Req() req: RequestWithAuthenticatedUser,
  ) {
    const currentUser = req.user;
    const status = this.videosService.getVideoStatus(videoId, currentUser.id);
    if (!status) {
      throw new NotFoundException('Video ID not found.');
    }
    return status;
  }
}
