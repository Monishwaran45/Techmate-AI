/**
 * LLM Provider Interface
 * Defines the contract for all LLM providers (OpenAI, Anthropic, etc.)
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

export interface ChatChunk {
  content: string;
  done: boolean;
}

export interface LLMProvider {
  readonly name: string;
  
  /**
   * Send a chat completion request
   */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  
  /**
   * Generate embeddings for text
   */
  embed(text: string): Promise<number[]>;
  
  /**
   * Stream chat completion
   */
  streamChat(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<ChatChunk>;
}
