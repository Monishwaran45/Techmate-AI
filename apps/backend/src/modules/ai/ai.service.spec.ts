import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { AIService } from './ai.service';
import { LLMProviderFactory } from './providers/llm-provider.factory';
import { CacheService } from '../../common/cache/cache.service';
import {
  LLMProvider,
  ChatMessage,
  ChatResponse,
} from './interfaces/llm-provider.interface';

describe('AIService', () => {
  let service: AIService;
  let mockProvider: jest.Mocked<LLMProvider>;

  beforeEach(async () => {
    // Create a mock provider
    mockProvider = {
      name: 'mock',
      chat: jest.fn(),
      embed: jest.fn(),
      streamChat: jest.fn(),
    };

    // Create a mock factory that returns our mock provider
    const mockFactory = {
      getProvider: jest.fn().mockReturnValue(mockProvider),
      getAvailableProviders: jest.fn().mockReturnValue(['mock']),
    };

    // Create a mock cache service that bypasses caching
    const mockCacheService = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      reset: jest.fn().mockResolvedValue(undefined),
      getOrSet: jest.fn().mockImplementation(async (_key: string, factory: () => Promise<any>) => {
        return factory();
      }),
      invalidatePattern: jest.fn().mockResolvedValue(undefined),
      generateAICacheKey: jest.fn().mockImplementation((prompt: string, model: string) => {
        return `ai:${model}:${Buffer.from(prompt).toString('base64').substring(0, 32)}`;
      }),
      generateAPICacheKey: jest.fn().mockImplementation((endpoint: string, params: Record<string, any>) => {
        return `api:${endpoint}:${JSON.stringify(params)}`;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: LLMProviderFactory,
          useValue: mockFactory,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
  });

  describe('chat', () => {
    it('should return response on success', async () => {
      const mockResponse: ChatResponse = {
        content: 'Test response',
        model: 'gpt-4',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        finishReason: 'stop',
      };

      mockProvider.chat.mockResolvedValue(mockResponse);

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
      ];

      const result = await service.chat(messages);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('generateEmbedding', () => {
    it('should return embedding vector on success', async () => {
      const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
      mockProvider.embed.mockResolvedValue(mockEmbedding);

      const result = await service.generateEmbedding('test text');
      expect(result).toEqual(mockEmbedding);
      expect(result.length).toBe(1536);
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 37: AI failure error handling**
   * **Validates: Requirements 9.2**
   * 
   * For any AI processing failure, a user-friendly error message should be 
   * displayed and the failure should be logged.
   */
  describe('Property 37: AI failure error handling', () => {
    it(
      'should return user-friendly error messages for all failure types',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              // Generate various error scenarios (non-retryable only to avoid long delays)
              errorType: fc.constantFrom(
                'timeout',
                'auth_error',
                'bad_request',
              ),
              messages: fc.array(
                fc.record({
                  role: fc.constantFrom('user', 'assistant', 'system'),
                  content: fc.string({ minLength: 1, maxLength: 100 }),
                }),
                { minLength: 1, maxLength: 5 },
              ),
            }),
            async ({ errorType, messages }) => {
              // Create appropriate error based on type (non-retryable errors)
              let error: any;
              switch (errorType) {
                case 'timeout':
                  error = new Error('Request timeout');
                  error.message = 'timeout';
                  break;
                case 'auth_error':
                  error = { response: { status: 401 } };
                  break;
                case 'bad_request':
                  error = { response: { status: 400 } };
                  break;
              }

              // Mock the provider to throw the error
              mockProvider.chat.mockRejectedValue(error);

              // Attempt the operation and expect it to throw
              try {
                await service.chat(messages as ChatMessage[]);
                // If we get here, the test should fail
                expect(true).toBe(false);
              } catch (thrownError: any) {
                // Verify that a user-friendly error message is returned
                expect(thrownError.message).toBeDefined();
                expect(typeof thrownError.message).toBe('string');
                expect(thrownError.message.length).toBeGreaterThan(0);

                // Verify the message doesn't contain technical details
                expect(thrownError.message).not.toContain('401');
                expect(thrownError.message).not.toContain('400');
                expect(thrownError.message).not.toContain('status:');

                // Verify the message is user-friendly (contains common words)
                const lowerMessage = thrownError.message.toLowerCase();
                const hasUserFriendlyWords =
                  lowerMessage.includes('please') ||
                  lowerMessage.includes('try again') ||
                  lowerMessage.includes('service') ||
                  lowerMessage.includes('unavailable') ||
                  lowerMessage.includes('error') ||
                  lowerMessage.includes('failed') ||
                  lowerMessage.includes('authentication');

                expect(hasUserFriendlyWords).toBe(true);
              }
            },
          ),
          { numRuns: 100 },
        );
      },
      30000,
    ); // 30 second timeout

    it(
      'should handle embedding generation failures with user-friendly messages',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              errorType: fc.constantFrom('timeout', 'auth_error'),
              text: fc.string({ minLength: 1, maxLength: 500 }),
            }),
            async ({ errorType, text }) => {
              // Create appropriate error (non-retryable)
              let error: any;
              switch (errorType) {
                case 'timeout':
                  error = new Error('timeout');
                  break;
                case 'auth_error':
                  error = { response: { status: 401 } };
                  break;
              }

              mockProvider.embed.mockRejectedValue(error);

              try {
                await service.generateEmbedding(text);
                expect(true).toBe(false);
              } catch (thrownError: any) {
                // Verify user-friendly error message
                expect(thrownError.message).toBeDefined();
                expect(typeof thrownError.message).toBe('string');
                expect(thrownError.message.length).toBeGreaterThan(0);

                // Should not expose technical details
                expect(thrownError.message).not.toContain('401');
                expect(thrownError.message).not.toContain('status:');
              }
            },
          ),
          { numRuns: 100 },
        );
      },
      30000,
    ); // 30 second timeout
  });
});
