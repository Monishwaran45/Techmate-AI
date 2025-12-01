import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';
import { Answer } from './answer.entity';

@Entity('interview_sessions')
@Index(['userId', 'status'])
export class InterviewSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['dsa', 'system_design', 'behavioral'],
  })
  type: 'dsa' | 'system_design' | 'behavioral';

  @OneToMany(() => Question, (question) => question.session, { cascade: true })
  questions: Question[];

  @OneToMany(() => Answer, (answer) => answer.session, { cascade: true })
  answers: Answer[];

  @Column({
    type: 'enum',
    enum: ['active', 'completed'],
    default: 'active',
  })
  status: 'active' | 'completed';

  @Column({ name: 'voice_mode_enabled', default: false })
  voiceModeEnabled: boolean;

  @Column({ type: 'jsonb', nullable: true })
  summary?: {
    overallScore: number;
    strengths: string[];
    improvements: string[];
  };

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
