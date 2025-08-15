import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type RoomStatus = 'waiting' | 'in-progress' | 'finished';

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

  @Column({
    type: 'boolean',
    default: () => "'false'",
  })
  active: boolean;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
