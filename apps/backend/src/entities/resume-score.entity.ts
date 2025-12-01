import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Resume } from './resume.entity';

@Entity('resume_scores')
export class ResumeScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'resume_id' })
  resumeId: string;

  @OneToOne(() => Resume, (resume) => resume.score, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'resume_id' })
  resume: Resume;

  @Column({ name: 'overall_score', type: 'int' })
  overallScore: number;

  @Column({ name: 'ats_compatibility', type: 'int' })
  atsCompatibility: number;

  @Column({ name: 'content_quality', type: 'int' })
  contentQuality: number;

  @Column('simple-array')
  suggestions: string[];

  @Column({ name: 'calculated_at', type: 'timestamp' })
  calculatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
