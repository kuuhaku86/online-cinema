import { Injectable, NotFoundException } from '@nestjs/common';
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

  async joinRoom(roomCode: string, userId: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { short_code: roomCode },
    });

    if (!room) {
      throw new NotFoundException(`Room with code "${roomCode}" not found.`);
    }

    if (!room.user_ids.includes(userId)) {
      room.user_ids.push(userId);
      return this.roomRepository.save(room);
    }

    return room;
  }
}