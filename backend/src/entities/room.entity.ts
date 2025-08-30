import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_rooms_short_code')
  @Column({
    name: 'short_code',
    type: 'varchar',
    length: 6,
    unique: true,
  })
  shortCode: string;

  @Column({
    name: 'owner_id',
    type: 'varchar',
  })
  ownerId: string;

  @Column({
    name: 'user_ids',
    type: 'jsonb',
    default: () => "'[]'",
  })
  userIds: string[];

  @Column({ default: false })
  active: boolean;

  @Column({
    name: 'video_id',
    type: 'varchar',
  })
  videoId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];
}
