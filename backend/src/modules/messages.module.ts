import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from 'src/entities/message.entity';
import { HateSpeechDetectorService } from 'src/services/hate-speech-detector.service';
import { MessagesService } from 'src/services/messages.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  providers: [MessagesService, HateSpeechDetectorService],
  exports: [MessagesService],
})
export class MessagesModule {}
