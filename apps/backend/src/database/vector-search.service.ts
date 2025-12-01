import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmbeddingDocument } from '../entities/embedding-document.entity';

@Injectable()
export class VectorSearchService {
  constructor(
    @InjectRepository(EmbeddingDocument)
    private embeddingRepository: Repository<EmbeddingDocument>
  ) {}

  /**
   * Find similar documents using cosine similarity
   * @param embedding - The query embedding vector
   * @param limit - Maximum number of results to return
   * @param userId - Optional user ID to filter results
   * @param sourceType - Optional source type to filter results
   * @returns Array of similar documents with similarity scores
   */
  async findSimilar(
    embedding: number[],
    limit: number = 10,
    userId?: string,
    sourceType?: 'code' | 'documentation' | 'note'
  ): Promise<Array<EmbeddingDocument & { similarity: number }>> {
    let query = this.embeddingRepository
      .createQueryBuilder('doc')
      .select('doc.*')
      .addSelect(`1 - (doc.embedding <=> '[${embedding.join(',')}]')`, 'similarity')
      .orderBy('similarity', 'DESC')
      .limit(limit);

    if (userId) {
      query = query.where('doc.user_id = :userId', { userId });
    }

    if (sourceType) {
      query = query.andWhere('doc.source_type = :sourceType', { sourceType });
    }

    const results = await query.getRawMany();
    return results;
  }

  /**
   * Create or update an embedding document
   */
  async upsertEmbedding(
    userId: string,
    sourceType: 'code' | 'documentation' | 'note',
    sourceId: string,
    content: string,
    embedding: number[],
    metadata: Record<string, any> = {}
  ): Promise<EmbeddingDocument> {
    // Check if document already exists
    const existing = await this.embeddingRepository.findOne({
      where: { userId, sourceType, sourceId },
    });

    if (existing) {
      existing.content = content;
      existing.embedding = embedding;
      existing.metadata = metadata;
      return this.embeddingRepository.save(existing);
    }

    const doc = this.embeddingRepository.create({
      userId,
      sourceType,
      sourceId,
      content,
      embedding,
      metadata,
    });

    return this.embeddingRepository.save(doc);
  }

  /**
   * Delete embeddings by source
   */
  async deleteBySource(
    sourceType: 'code' | 'documentation' | 'note',
    sourceId: string
  ): Promise<void> {
    await this.embeddingRepository.delete({ sourceType, sourceId });
  }

  /**
   * Delete all embeddings for a user
   */
  async deleteByUser(userId: string): Promise<void> {
    await this.embeddingRepository.delete({ userId });
  }
}
