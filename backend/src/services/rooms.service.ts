import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';
import { v4 as uuidv4 } from 'uuid';
import { Video } from 'src/entities/video.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
  ) {}

  async createRoom(userId: string): Promise<Room> {
    const shortCode = uuidv4().replace(/-/g, '').substring(0, 6);

    const newRoom = this.roomRepository.create({
      userIds: [userId],
      ownerId: userId,
      shortCode,
    });

    const savedRoom = await this.roomRepository.save(newRoom);

    console.log(savedRoom);

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

  async startRoom(
    roomCode: string,
    videoId: string,
    userId: string,
  ): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { shortCode: roomCode, ownerId: userId },
    });

    if (!room) {
      throw new NotFoundException(`Room with code "${roomCode}" not found.`);
    }

    if (room.active) {
      throw new BadRequestException(`Room already active`);
    }

    const video = await this.videoRepository.findOne({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException(`Video with ID "${videoId}" not found.`);
    }

    if (!video.ready) {
      throw new BadRequestException(`Video is not ready`);
    }

    room.active = true;
    room.videoId = videoId;
    return this.roomRepository.save(room);
  }

  async checkUserAccessToRoomAndVideo(
    roomShortCode: string,
    videoId: string,
    userId: string,
  ) {
    const room = await this.roomRepository.findOneBy({
      shortCode: roomShortCode,
      videoId,
    });

    if (!room) {
      throw new NotFoundException(
        `Room with ID "${roomShortCode}" and Video ID "${videoId}" not found.`,
      );
    }

    return room?.userIds.includes(userId);
  }
}
