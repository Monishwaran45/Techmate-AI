import { Injectable, Logger, RequestTimeoutException, Inject } from '@nestjs/common';
import { LLMProviderFactory } from './providers/llm-provider.factory';
import {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatChunk,
} from './interfaces/llm-provider.interface';
import { CacheService } from '../../common/cache/cache.service';

/**
 * AI Service with error handling, timeouts, retry logic, and caching
 * Provides high-level AI operations with resilience features
 */
@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second
  private readonly AI_CACHE_TTL = 3600000; // 1 hour for AI responses

  constructor(
    private readonly providerFactory: LLMProviderFactory,
    @Inject(CacheService) private readonly cacheService: CacheService,
  ) {
    this.logger.log('AI Service initialized with caching support');
  }

  /**
   * Send a chat completion request with timeout, retry logic, and caching
   * Caches responses for deterministic queries (temperature = 0)
   */
  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<ChatResponse> {
    // Only cache deterministic responses (temperature = 0)
    const shouldCache = options?.temperature === 0 || options?.temperature === undefined;
    
    if (shouldCache) {
      const cacheKey = this.cacheService.generateAICacheKey(
        JSON.stringify(messages),
        options?.model || 'default',
      );
      
      return this.cacheService.getOrSet(
        cacheKey,
        async () => {
          return this.withRetry(async () => {
            return this.withTimeout(
              this.providerFactory.getProvider().chat(messages, options),
              this.DEFAULT_TIMEOUT,
              'Chat request',
            );
          });
        },
        { ttl: this.AI_CACHE_TTL },
      );
    }

    return this.withRetry(async () => {
      return this.withTimeout(
        this.providerFactory.getProvider().chat(messages, options),
        this.DEFAULT_TIMEOUT,
        'Chat request',
      );
    });
  }

  /**
   * Generate embeddings with timeout, retry logic, and caching
   * Embeddings are deterministic so always cached
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = this.cacheService.generateAICacheKey(text, 'embedding');
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.withRetry(async () => {
          return this.withTimeout(
            this.providerFactory.getProvider().embed(text),
            this.DEFAULT_TIMEOUT,
            'Embedding generation',
          );
        });
      },
      { ttl: this.AI_CACHE_TTL },
    );
  }

  /**
   * Stream chat completion
   */
  async *streamChat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncIterable<ChatChunk> {
    try {
      const provider = this.providerFactory.getProvider();
      const stream = provider.streamChat(messages, options);
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error: any) {
      const userMessage = this.getUserFriendlyErrorMessage(error);
      this.logger.error(
        `Streaming chat failed: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new Error(userMessage);
    }
  }

  /**
   * Execute an operation with timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new RequestTimeoutException(
            `${operationName} timed out after ${timeoutMs}ms`,
          ),
        );
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } catch (error) {
      if (error instanceof RequestTimeoutException) {
        this.logger.error(`${operationName} timed out`);
        throw new Error(
          'The AI service is taking longer than expected. Please try again.',
        );
      }
      throw error;
    }
  }

  /**
   * Execute an operation with exponential backoff retry logic
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    retryCount = 0,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Check if error is retryable
      if (!this.isRetryableError(error) || retryCount >= this.MAX_RETRIES) {
        const userMessage = this.getUserFriendlyErrorMessage(error);
        this.logger.error(
          `Operation failed after ${retryCount} retries: ${(error as any)?.message || 'Unknown error'}`,
          (error as any)?.stack,
        );
        throw new Error(userMessage);
      }

      // Calculate exponential backoff delay
      const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      this.logger.warn(
        `Retrying operation (attempt ${retryCount + 1}/${this.MAX_RETRIES}) after ${delay}ms`,
      );

      // Wait before retrying
      await this.sleep(delay);

      // Retry the operation
      return this.withRetry(operation, retryCount + 1);
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on network errors, rate limits, and temporary server errors
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const statusCode = error?.response?.status || error?.status;

    if (statusCode && retryableStatusCodes.includes(statusCode)) {
      return true;
    }

    // Retry on network errors
    if (
      error?.code === 'ECONNRESET' ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ENOTFOUND'
    ) {
      return true;
    }

    return false;
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private getUserFriendlyErrorMessage(error: any): string {
    const statusCode = error?.response?.status || error?.status;

    switch (statusCode) {
      case 401:
        return 'AI service authentication failed. Please contact support.';
      case 429:
        return 'Too many requests to the AI service. Please try again in a moment.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'The AI service is temporarily unavailable. Please try again later.';
      default:
        if (error?.message?.includes('timeout')) {
          return 'The AI service is taking longer than expected. Please try again.';
        }
        return 'An error occurred while processing your request. Please try again.';
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
