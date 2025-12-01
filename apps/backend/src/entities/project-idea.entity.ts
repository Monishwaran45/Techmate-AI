import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { ProjectArchitecture } from './project-architecture.entity';

@Entity('project_ideas')
@Index(['userId', 'difficulty'])
export class ProjectIdea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ['beginner', 'intermediate', 'advanced'],
  })
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  @Column('simple-array')
  technologies: string[];

  @Column({ name: 'estimated_hours', type: 'int' })
  estimatedHours: number;

  @OneToOne(() => ProjectArchitecture, (architecture) => architecture.projectIdea, {
    cascade: true,
  })
  architecture?: ProjectArchitecture;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
