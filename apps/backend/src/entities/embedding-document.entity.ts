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

@Entity('embedding_documents')
@Index(['userId', 'sourceType'])
export class EmbeddingDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'source_type',
    type: 'enum',
    enum: ['code', 'documentation', 'note'],
  })
  sourceType: 'code' | 'documentation' | 'note';

  @Column({ name: 'source_id' })
  sourceId: string;

  @Column({ type: 'text' })
  content: string;

  // Using array type for pgvector compatibility
  // The actual vector type will be set up in migration
  @Column({ type: 'real', array: true })
  embedding: number[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
