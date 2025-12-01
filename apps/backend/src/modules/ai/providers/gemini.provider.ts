import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LLMProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatChunk,
} from '../interfaces/llm-provider.interface';

/**
 * Google Gemini LLM Provider
 * Implements the LLMProvider interface for Google's Gemini API
 */
@Injectable()
export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly defaultModel: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY', '');
    this.defaultModel = this.configService.get<string>('GEMINI_MODEL', 'gemini-2.0-flash');

    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY is not configured. AI features will not work.');
    }

    this.logger.log(`Gemini Provider initialized with model: ${this.defaultModel}`);
  }

  /**
   * Convert chat messages to Gemini format
   */
  private convertMessages(messages: ChatMessage[]): { contents: any[]; systemInstruction?: any } {
    const systemMessages = messages.filter(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');

    const contents = otherMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const result: { contents: any[]; systemInstruction?: any } = { contents };

    if (systemMessages.length > 0) {
      result.systemInstruction = {
        parts: [{ text: systemMessages.map(m => m.content).join('\n') }],
      };
    }

    return result;
  }

  /**
   * Send a chat completion request to Gemini
   */
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const model = options?.model || this.defaultModel;
    const { contents, systemInstruction } = this.convertMessages(messages);

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const content = candidate?.content?.parts?.[0]?.text || '';

      return {
        content,
        model,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0,
        },
        finishReason: candidate?.finishReason || 'stop',
      };
    } catch (error: any) {
      this.logger.error(`Gemini chat error: ${error?.message || error}`);
      throw error;
    }
  }

  /**
   * Generate embeddings using Gemini
   */
  async embed(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/models/text-embedding-004:embedContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini embedding error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.embedding?.values || [];
    } catch (error: any) {
      this.logger.error(`Gemini embed error: ${error?.message || error}`);
      throw error;
    }
  }

  /**
   * Stream chat completion from Gemini
   */
  async *streamChat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatChunk> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const model = options?.model || this.defaultModel;
    const { contents, systemInstruction } = this.convertMessages(messages);

    const requestBody: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini stream error: ${error.error?.message || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (text) {
                yield { content: text, done: false };
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      yield { content: '', done: true };
    } catch (error: any) {
      this.logger.error(`Gemini stream error: ${error?.message || error}`);
      throw error;
    }
  }
}
