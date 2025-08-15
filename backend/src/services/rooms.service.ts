import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async createRoom(userId: string): Promise<Room> {
    const shortCode = uuidv4().replace(/-/g, '').substring(0, 6);

    const newRoom = this.roomRepository.create({
      userIds: [userId],
      ownerId: userId,
      shortCode,
    });

    const savedRoom = await this.roomRepository.save(newRoom);

    return savedRoom;
  }

  async joinRoom(roomCode: string, userId: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { shortCode: roomCode },
    });

    if (!room) {
      throw new NotFoundException(`Room with code "${roomCode}" not found.`);
    }

    if (!room.active) {
      throw new BadRequestException(`Room is not active`);
    }

    if (!room.userIds.includes(userId)) {
      room.userIds.push(userId);
      return this.roomRepository.save(room);
    }

    return room;
  }

  async startRoom(roomCode: string, userId: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { shortCode: roomCode, ownerId: userId },
    });

    if (!room) {
      throw new NotFoundException(`Room with code "${roomCode}" not found.`);
    }

    if (room.active) {
      throw new BadRequestException(`Room already active`);
    }

    room.active = true;
    return this.roomRepository.save(room);
  }
}
