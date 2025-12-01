import { Injectable, Logger } from '@nestjs/common';
import { AIService } from './ai.service';
import { VectorSearchService } from '../../database/vector-search.service';
import { ChatMessage } from './interfaces/llm-provider.interface';

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Implements document chunking, indexing, and context-aware generation
 */
@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);
  private readonly CHUNK_SIZE = 1000; // characters per chunk
  private readonly CHUNK_OVERLAP = 200; // overlap between chunks
  private readonly TOP_K_RESULTS = 5; // number of similar documents to retrieve

  constructor(
    private readonly aiService: AIService,
    private readonly vectorSearchService: VectorSearchService,
  ) {
    this.logger.log('RAG Service initialized');
  }

  /**
   * Chunk a document into smaller pieces with overlap
   */
  chunkDocument(content: string): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < content.length) {
      const endIndex = Math.min(startIndex + this.CHUNK_SIZE, content.length);
      const chunk = content.substring(startIndex, endIndex);
      chunks.push(chunk);

      // Move forward by chunk size minus overlap
      startIndex += this.CHUNK_SIZE - this.CHUNK_OVERLAP;

      // Prevent infinite loop if chunk size is too small
      if (startIndex >= content.length) {
        break;
      }
    }

    this.logger.debug(`Chunked document into ${chunks.length} pieces`);
    return chunks;
  }

  /**
   * Index a document by chunking it and storing embeddings
   */
  async indexDocument(
    userId: string,
    sourceType: 'code' | 'documentation' | 'note',
    sourceId: string,
    content: string,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    try {
      this.logger.debug(
        `Indexing document: ${sourceType}/${sourceId} for user ${userId}`,
      );

      // Chunk the document
      const chunks = this.chunkDocument(content);

      // Generate embeddings and store each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkId = `${sourceId}_chunk_${i}`;

        // Generate embedding for this chunk
        const embedding = await this.aiService.generateEmbedding(chunk);

        // Store the chunk with its embedding
        await this.vectorSearchService.upsertEmbedding(
          userId,
          sourceType,
          chunkId,
          chunk,
          embedding,
          {
            ...metadata,
            chunkIndex: i,
            totalChunks: chunks.length,
            originalSourceId: sourceId,
          },
        );
      }

      this.logger.log(
        `Successfully indexed ${chunks.length} chunks for ${sourceType}/${sourceId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to index document: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new Error('Failed to index document. Please try again.');
    }
  }

  /**
   * Retrieve relevant context for a query
   */
  async retrieveContext(
    query: string,
    userId?: string,
    sourceType?: 'code' | 'documentation' | 'note',
  ): Promise<string[]> {
    try {
      this.logger.debug(`Retrieving context for query: "${query.substring(0, 50)}..."`);

      // Generate embedding for the query
      const queryEmbedding = await this.aiService.generateEmbedding(query);

      // Find similar documents
      const similarDocs = await this.vectorSearchService.findSimilar(
        queryEmbedding,
        this.TOP_K_RESULTS,
        userId,
        sourceType,
      );

      // Extract content from similar documents
      const context = similarDocs.map((doc) => doc.content);

      this.logger.debug(`Retrieved ${context.length} relevant documents`);
      return context;
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve context: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new Error('Failed to retrieve context. Please try again.');
    }
  }

  /**
   * Generate a response with retrieved context injected
   */
  async generateWithContext(
    query: string,
    userId?: string,
    sourceType?: 'code' | 'documentation' | 'note',
    additionalMessages?: ChatMessage[],
  ): Promise<string> {
    try {
      this.logger.debug(`Generating response with context for query`);

      // Retrieve relevant context
      const contextDocs = await this.retrieveContext(query, userId, sourceType);

      // Build context string
      const contextString = contextDocs.length > 0
        ? `Here is some relevant context:\n\n${contextDocs.join('\n\n---\n\n')}\n\n`
        : '';

      // Build messages array
      const messages: ChatMessage[] = [
        ...(additionalMessages || []),
        {
          role: 'system',
          content: `You are a helpful assistant. Use the following context to answer the user's question. If the context doesn't contain relevant information, say so and provide a general answer.`,
        },
        {
          role: 'user',
          content: `${contextString}Question: ${query}`,
        },
      ];

      // Generate response
      const response = await this.aiService.chat(messages);

      this.logger.debug('Successfully generated response with context');
      return response.content;
    } catch (error: any) {
      this.logger.error(
        `Failed to generate with context: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new Error('Failed to generate response. Please try again.');
    }
  }

  /**
   * Delete indexed document
   */
  async deleteDocument(
    sourceType: 'code' | 'documentation' | 'note',
    sourceId: string
  ): Promise<void> {
    try {
      this.logger.debug(`Deleting indexed document: ${sourceType}/${sourceId}`);

      // Delete all chunks for this document
      await this.vectorSearchService.deleteBySource(sourceType, sourceId);

      this.logger.log(`Successfully deleted document ${sourceType}/${sourceId}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to delete document: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new Error('Failed to delete document. Please try again.');
    }
  }

  /**
   * Delete all indexed documents for a user
   */
  async deleteUserDocuments(userId: string): Promise<void> {
    try {
      this.logger.debug(`Deleting all documents for user ${userId}`);

      await this.vectorSearchService.deleteByUser(userId);

      this.logger.log(`Successfully deleted all documents for user ${userId}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to delete user documents: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new Error('Failed to delete user documents. Please try again.');
    }
  }
}
