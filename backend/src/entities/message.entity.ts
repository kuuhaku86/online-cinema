import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Room } from './room.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({
    name: 'user_id',
    type: 'varchar',
  })
  userId: string;

  @ManyToOne(() => Room, (room) => room.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_short_code', referencedColumnName: 'shortCode' })
  room: Room;

  @Column({
    name: 'room_short_code',
    type: 'varchar',
  })
  roomShortCode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
