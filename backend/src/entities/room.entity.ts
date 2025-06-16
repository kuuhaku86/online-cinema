import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_rooms_short_code')
  @Column({ type: 'varchar', length: 6, unique: true })
  short_code: string;

  @Column({
    type: 'jsonb',
    default: () => "'[]'",
  })
  user_ids: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}