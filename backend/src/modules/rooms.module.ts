import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '../entities/room.entity';
import { RoomsController } from '../controllers/rooms.controller';
import { RoomsService } from '../services/rooms.service';
import { AuthModule } from './auth.module';
import { Video } from 'src/entities/video.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Video]), AuthModule],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
