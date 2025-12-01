import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User, (user) => user.profile)
  user: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column('simple-array')
  skills: string[];

  @Column('simple-array')
  goals: string[];

  @Column()
  experience: string;

  @Column({ type: 'jsonb', default: {} })
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
