import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('job_matches')
@Index(['userId', 'matchScore'])
export class JobMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'job_title' })
  jobTitle: string;

  @Column()
  company: string;

  @Column({ name: 'match_score', type: 'int' })
  matchScore: number;

  @Column('simple-array', { name: 'match_reasons' })
  matchReasons: string[];

  @Column({ name: 'job_url', nullable: true })
  jobUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'simple-array', nullable: true })
  requiredSkills?: string[];

  @Column({ nullable: true })
  location?: string;

  @Column({ name: 'salary_range', nullable: true })
  salaryRange?: string;

  @Column({ default: false })
  notified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
