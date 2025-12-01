import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider } from '../interfaces/llm-provider.interface';
import { OpenAIProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';

/**
 * Factory for creating LLM provider instances
 * Supports multiple providers and can be extended for new providers
 */
@Injectable()
export class LLMProviderFactory {
  private readonly logger = new Logger(LLMProviderFactory.name);
  private providers: Map<string, LLMProvider> = new Map();

  constructor(
    private readonly configService: ConfigService,
    openAIProvider: OpenAIProvider,
    geminiProvider: GeminiProvider,
  ) {
    // Register available providers
    this.registerProvider(openAIProvider);
    this.registerProvider(geminiProvider);
    this.logger.log('LLM Provider Factory initialized');
  }

  /**
   * Register a new LLM provider
   */
  private registerProvider(provider: LLMProvider): void {
    this.providers.set(provider.name, provider);
    this.logger.log(`Registered provider: ${provider.name}`);
  }

  /**
   * Get a provider by name, defaults to configured provider
   */
  getProvider(name?: string): LLMProvider {
    const providerName =
      name || this.configService.get<string>('LLM_PROVIDER', 'openai');

    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`LLM provider '${providerName}' not found`);
    }

    return provider;
  }

  /**
   * Get all available provider names
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
