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
    roomId: string,
    content: string,
  ): Promise<Message> {
    const newMessage = this.messageRepository.create({
      userId,
      roomId,
      text: content,
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
