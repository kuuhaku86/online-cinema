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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VideosService } from '../services/videos.service';
import { User } from '../entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

interface RequestWithAuthenticatedUser extends Request {
  user: Pick<User, 'id'>;
}

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: './uploads/videos', // Ensure this directory exists
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${uniqueSuffix}${ext}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Invalid file type. Only video files are allowed.',
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 1024 * 1024 * 500, // 500 MB limit
      },
    }),
  )

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
}