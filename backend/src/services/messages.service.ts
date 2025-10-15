import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from 'src/entities/message.entity';
import { HateSpeechDetectorService } from './hate-speech-detector.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly hateSpeechDetectorService: HateSpeechDetectorService,
  ) {}

  async createMessage(
    userId: string,
    roomId: string,
    content: string,
  ): Promise<Message> {
    const detectionResult =
      await this.hateSpeechDetectorService.detect(content);

    const messageToSave = detectionResult.isHate ? '******' : content;

    const newMessage = this.messageRepository.create({
      userId,
      roomId,
      text: messageToSave,
    });

    const savedMessage = await this.messageRepository.save(newMessage);

    console.log(savedMessage);

    return savedMessage;
  }

  async getMessage(roomId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { roomId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }
}
