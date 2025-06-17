import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async createRoom(userId: string): Promise<Room> {
    const shortCode = uuidv4().replace(/-/g, '').substring(0, 6);

    const newRoom = this.roomRepository.create({
      user_ids: [userId],
      short_code: shortCode,
    });

    const savedRoom = await this.roomRepository.save(newRoom);

    return savedRoom;
  }
}