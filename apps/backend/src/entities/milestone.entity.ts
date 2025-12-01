import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Roadmap } from './roadmap.entity';

@Entity('milestones')
@Index(['roadmapId', 'order'])
export class Milestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'roadmap_id' })
  roadmapId: string;

  @ManyToOne(() => Roadmap, (roadmap) => roadmap.milestones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roadmap_id' })
  roadmap: Roadmap;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column('simple-array')
  topics: string[];

  @Column({ type: 'jsonb', default: [] })
  resources: Array<{
    title: string;
    url: string;
    type: 'article' | 'video' | 'course' | 'documentation';
  }>;

  @Column({ type: 'int' })
  order: number;

  @Column({ default: false })
  completed: boolean;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
