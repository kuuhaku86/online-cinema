import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '../entities/room.entity';
import { RoomsController } from '../controllers/rooms.controller';
import { RoomsService } from '../services/rooms.service';
import { AuthModule } from './auth.module';
import { Video } from 'src/entities/video.entity';
import { MessagesModule } from './messages.module';
import { HelpersModule } from './helpers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Video]),
    AuthModule,
    MessagesModule,
    HelpersModule,
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
