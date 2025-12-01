import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ProjectIdea } from './project-idea.entity';
import { CodeFile } from './code-file.entity';

@Entity('project_architectures')
export class ProjectArchitecture {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_idea_id' })
  projectIdeaId: string;

  @OneToOne(() => ProjectIdea, (idea) => idea.architecture, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_idea_id' })
  projectIdea: ProjectIdea;

  @Column({ type: 'jsonb' })
  folderStructure: {
    name: string;
    type: 'file' | 'folder';
    children?: any[];
  };

  @Column({ type: 'jsonb' })
  techStack: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    devOps?: string[];
  };

  @Column({ type: 'jsonb' })
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    order: number;
  }>;

  @Column({ type: 'jsonb' })
  dependencies: Array<{
    name: string;
    version: string;
    type: 'production' | 'development';
  }>;

  @OneToMany(() => CodeFile, (codeFile) => codeFile.architecture, { cascade: true })
  codeFiles: CodeFile[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
