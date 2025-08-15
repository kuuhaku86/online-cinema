import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Video } from './video.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, length: 50 })
  username: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
  })
  passwordHash: string;

  @Column({
    name: 'current_hashed_refresh_token',
    type: 'varchar',
    nullable: true,
  })
  currentHashedRefreshToken: string | null;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @OneToMany(() => Video, (video) => video.user)
  videos: Video[];
}
