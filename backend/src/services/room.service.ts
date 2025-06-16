import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async createRoom(userId: string): Promise<Room> {

    const newRoom = this.roomRepository.create({
      user_ids: [userId],
    });

    return this.roomRepository.save(newRoom);
  }
}