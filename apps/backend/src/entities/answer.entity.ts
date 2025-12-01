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
import { Question } from './question.entity';

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @ManyToOne(() => InterviewSession, (session) => session.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: InterviewSession;

  @Column({ name: 'question_id' })
  questionId: string;

  @OneToOne(() => Question, (question) => question.answer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb' })
  evaluation: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };

  @Column({ name: 'audio_url', nullable: true })
  audioUrl?: string;

  @Column({ name: 'submitted_at', type: 'timestamp' })
  submittedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
