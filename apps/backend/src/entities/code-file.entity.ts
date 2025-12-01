import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ProjectArchitecture } from './project-architecture.entity';

@Entity('code_files')
export class CodeFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'architecture_id' })
  architectureId: string;

  @ManyToOne(() => ProjectArchitecture, (architecture) => architecture.codeFiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'architecture_id' })
  architecture: ProjectArchitecture;

  @Column()
  path: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  language: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
