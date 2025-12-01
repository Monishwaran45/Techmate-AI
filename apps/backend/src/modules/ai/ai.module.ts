import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { LLMProviderFactory } from './providers/llm-provider.factory';
import { AIService } from './ai.service';
import { RAGService } from './rag.service';
import { ResponseValidationService } from './response-validation.service';
import { VectorSearchService } from '../../database/vector-search.service';
import { EmbeddingDocument } from '../../entities/embedding-document.entity';
import { AIFeedback } from '../../entities/ai-feedback.entity';
import { CacheModule } from '../../common/cache/cache.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([EmbeddingDocument, AIFeedback]),
    CacheModule,
  ],
  providers: [
    OpenAIProvider,
    GeminiProvider,
    LLMProviderFactory,
    AIService,
    VectorSearchService,
    RAGService,
    ResponseValidationService,
  ],
  exports: [
    LLMProviderFactory,
    AIService,
    RAGService,
    VectorSearchService,
    ResponseValidationService,
  ],
})
export class AIModule {}
