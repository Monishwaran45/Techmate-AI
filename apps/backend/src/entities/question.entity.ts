import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { InterviewSession } from './interview-session.entity';
import { Answer } from './answer.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @ManyToOne(() => InterviewSession, (session) => session.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: InterviewSession;

  @Column()
  type: string;

  @Column({
    type: 'enum',
    enum: ['easy', 'medium', 'hard'],
  })
  difficulty: 'easy' | 'medium' | 'hard';

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-array', nullable: true })
  hints?: string[];

  @Column({ type: 'int' })
  order: number;

  @OneToOne(() => Answer, (answer) => answer.question)
  answer?: Answer;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
