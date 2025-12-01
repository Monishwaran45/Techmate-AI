import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ResumeScore } from './resume-score.entity';

@Entity('resumes')
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ type: 'jsonb' })
  parsedData: {
    name: string;
    email: string;
    phone?: string;
    skills: string[];
    experience: Array<{
      company: string;
      position: string;
      startDate: Date;
      endDate?: Date;
      description: string;
    }>;
    education: Array<{
      institution: string;
      degree: string;
      field: string;
      graduationDate: Date;
    }>;
    summary?: string;
  };

  @OneToOne(() => ResumeScore, (score) => score.resume, { cascade: true })
  score?: ResumeScore;

  @Column({ name: 'uploaded_at', type: 'timestamp' })
  uploadedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
