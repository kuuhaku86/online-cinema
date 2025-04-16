import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users') // Specifies the table name in the database
export class User {
  @PrimaryGeneratedColumn('uuid') // Generates a UUID for the primary key
  id: string;

  @Column({ unique: true, length: 50 }) // Username column, must be unique
  username: string;

  @Column({ unique: true }) // Email column, must be unique
  email: string;

  @Column() // Password column (remember to hash passwords before saving!)
  passwordHash: string; // Store the hash, not the plain password

  @Column({ nullable: true, length: 100 }) // Optional name
  name?: string;

  @CreateDateColumn() // Automatically sets the creation date/time
  createdAt: Date;

  @UpdateDateColumn() // Automatically sets the update date/time on changes
  updatedAt: Date;

  // You can add more properties and relations here as needed
  // For example:
  // @Column({ default: true })
  // isActive: boolean;
}
