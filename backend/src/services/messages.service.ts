import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from 'src/entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async createMessage(
    userId: string,
    roomShortCode: string,
    content: string,
  ): Promise<Message> {
    const newMessage = this.messageRepository.create({
      userId,
      roomShortCode,
      content,
    });

    const savedMessage = await this.messageRepository.save(newMessage);

    console.log(savedMessage);

    return savedMessage;
  }

  async getMessage(roomShortCode: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { roomShortCode },
    });
  }
}
