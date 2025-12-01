import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  LLMProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatChunk,
} from '../interfaces/llm-provider.interface';

/**
 * OpenAI LLM Provider Implementation
 * Handles communication with OpenAI's API for chat and embeddings
 */
@Injectable()
export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly client: OpenAI;
  private readonly defaultModel: string;
  private readonly embeddingModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    // Allow startup without API key in development (AI features will fail gracefully)
    if (!apiKey || apiKey.startsWith('sk-svcacct-') === false && apiKey.startsWith('sk-') === false) {
      this.logger.warn('OPENAI_API_KEY is not configured or invalid. AI features will not work.');
      this.client = null as any;
    } else {
      this.client = new OpenAI({ apiKey });
    }
    
    this.defaultModel = this.configService.get<string>('OPENAI_MODEL', 'gpt-4');
    this.embeddingModel = this.configService.get<string>(
      'OPENAI_EMBEDDING_MODEL',
      'text-embedding-3-large',
    );

    this.logger.log(`OpenAI Provider initialized with model: ${this.defaultModel}`);
  }

  /**
   * Send a chat completion request to OpenAI
   */
  async chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please configure OPENAI_API_KEY.');
    }
    
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Sending chat request with ${messages.length} messages`);

      const response = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
      });

      const duration = Date.now() - startTime;
      this.logger.debug(`Chat request completed in ${duration}ms`);

      const choice = response.choices[0];
      return {
        content: choice.message.content || '',
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        finishReason: choice.finish_reason,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Chat request failed after ${duration}ms: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Generate embeddings for text using OpenAI
   */
  async embed(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please configure OPENAI_API_KEY.');
    }
    
    const startTime = Date.now();

    try {
      this.logger.debug(`Generating embedding for text of length ${text.length}`);

      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      const duration = Date.now() - startTime;
      this.logger.debug(`Embedding generated in ${duration}ms`);

      return response.data[0].embedding;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Embedding generation failed after ${duration}ms: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Stream chat completion from OpenAI
   */
  async *streamChat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncIterable<ChatChunk> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. Please configure OPENAI_API_KEY.');
    }
    
    try {
      this.logger.debug(`Starting streaming chat with ${messages.length} messages`);

      const stream = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        const done = chunk.choices[0]?.finish_reason !== null;

        yield {
          content,
          done,
        };
      }

      this.logger.debug('Streaming chat completed');
    } catch (error: any) {
      this.logger.error(`Streaming chat failed: ${error?.message || 'Unknown error'}`, error?.stack);
      throw error;
    }
  }
}
