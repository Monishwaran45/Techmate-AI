import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';
import { ResponseValidationService } from './response-validation.service';
import { AIFeedback } from '../../entities/ai-feedback.entity';

describe('ResponseValidationService', () => {
  let service: ResponseValidationService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: 'test-id' })),
      find: jest.fn(() => Promise.resolve([])),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        clone: jest.fn().mockReturnThis(),
        getCount: jest.fn(() => Promise.resolve(0)),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseValidationService,
        {
          provide: getRepositoryToken(AIFeedback),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ResponseValidationService>(ResponseValidationService);
  });

  describe('validateResponse', () => {
    it('should validate non-empty responses', () => {
      const result = service.validateResponse('This is a valid response');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedResponse).toBe('This is a valid response');
    });

    it('should reject empty responses', () => {
      const result = service.validateResponse('');
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Response is empty');
    });

    it('should detect comments in code', () => {
      const codeWithComments = `
        // This is a comment
        function test() {
          return true;
        }
      `;
      const result = service.validateResponse(codeWithComments, true);
      expect(result.hasComments).toBe(true);
    });
  });

  describe('detectComments', () => {
    it('should detect single-line comments', () => {
      expect(service.detectComments('// comment')).toBe(true);
      expect(service.detectComments('# comment')).toBe(true);
    });

    it('should detect multi-line comments', () => {
      expect(service.detectComments('/* comment */')).toBe(true);
      expect(service.detectComments('<!-- comment -->')).toBe(true);
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 38: Generated code includes comments**
   * **Validates: Requirements 9.3**
   * 
   * For any AI-generated code, the output should contain at least one comment 
   * or documentation string.
   */
  describe('Property 38: Generated code includes comments', () => {
    it('should detect comments in all valid code samples', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate code with various comment styles
            commentStyle: fc.constantFrom(
              'single-line-slash',
              'single-line-hash',
              'multi-line',
              'html',
              'docstring-double',
              'docstring-single',
            ),
            codeContent: fc.string({ minLength: 10, maxLength: 200 }),
          }),
          async ({ commentStyle, codeContent }) => {
            // Generate code with the specified comment style
            let codeWithComment: string;

            switch (commentStyle) {
              case 'single-line-slash':
                codeWithComment = `// ${codeContent}\nfunction test() { return true; }`;
                break;
              case 'single-line-hash':
                codeWithComment = `# ${codeContent}\ndef test():\n    return True`;
                break;
              case 'multi-line':
                codeWithComment = `/* ${codeContent} */\nfunction test() { return true; }`;
                break;
              case 'html':
                codeWithComment = `<!-- ${codeContent} -->\n<div>Test</div>`;
                break;
              case 'docstring-double':
                codeWithComment = `"""${codeContent}"""\ndef test():\n    return True`;
                break;
              case 'docstring-single':
                codeWithComment = `'''${codeContent}'''\ndef test():\n    return True`;
                break;
            }

            // Validate that comments are detected
            const result = service.validateResponse(codeWithComment, true);

            // The code should have comments detected
            expect(result.hasComments).toBe(true);

            // The response should be valid
            expect(result.isValid).toBe(true);

            // The sanitized response should not be empty
            expect(result.sanitizedResponse.length).toBeGreaterThan(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should detect absence of comments in code without comments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate code without comments
            language: fc.constantFrom('javascript', 'python', 'html'),
          }),
          async ({ language }) => {
            // Generate simple code without comments
            let codeWithoutComments: string;

            switch (language) {
              case 'javascript':
                codeWithoutComments = 'function test() { return true; }';
                break;
              case 'python':
                codeWithoutComments = 'def test():\n    return True';
                break;
              case 'html':
                codeWithoutComments = '<div>Test</div>';
                break;
            }

            // Validate that no comments are detected
            const result = service.validateResponse(codeWithoutComments, true);

            // The code should NOT have comments detected
            expect(result.hasComments).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('storeFeedback', () => {
    it('should store feedback successfully', async () => {
      const feedbackDto = {
        userId: 'user-123',
        prompt: 'Test prompt',
        response: 'Test response',
        rating: 'positive' as const,
        comment: 'Great response',
      };

      const result = await service.storeFeedback(feedbackDto);

      expect(mockRepository.create).toHaveBeenCalledWith(feedbackDto);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('test-id');
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 40: Feedback persistence**
   * **Validates: Requirements 9.5**
   * 
   * For any user feedback on AI responses, the feedback should be stored in 
   * the database and retrievable.
   */
  describe('Property 40: Feedback persistence', () => {
    it('should persist and retrieve all feedback data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            prompt: fc.string({ minLength: 1, maxLength: 500 }),
            response: fc.string({ minLength: 1, maxLength: 1000 }),
            rating: fc.constantFrom('positive', 'negative', 'neutral'),
            comment: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
            metadata: fc.option(
              fc.record({
                model: fc.string(),
                tokens: fc.nat(),
              }),
            ),
          }),
          async (feedbackData) => {
            // Mock the repository to return the saved feedback
            const savedFeedback = {
              ...feedbackData,
              id: 'generated-id',
              createdAt: new Date(),
            };

            mockRepository.save.mockResolvedValueOnce(savedFeedback);
            mockRepository.find.mockResolvedValueOnce([savedFeedback]);

            // Store the feedback
            const stored = await service.storeFeedback(feedbackData as any);

            // Verify the feedback was created with correct data
            expect(mockRepository.create).toHaveBeenCalledWith(feedbackData);
            expect(mockRepository.save).toHaveBeenCalled();

            // Verify the stored feedback has an ID
            expect(stored.id).toBeDefined();
            expect(typeof stored.id).toBe('string');

            // Retrieve the feedback
            const retrieved = await service.getUserFeedback(feedbackData.userId);

            // Verify the feedback is retrievable
            expect(retrieved).toBeDefined();
            expect(Array.isArray(retrieved)).toBe(true);

            // If we got results, verify the data matches
            if (retrieved.length > 0) {
              const firstResult = retrieved[0];
              expect(firstResult.userId).toBe(feedbackData.userId);
              expect(firstResult.prompt).toBe(feedbackData.prompt);
              expect(firstResult.response).toBe(feedbackData.response);
              expect(firstResult.rating).toBe(feedbackData.rating);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should handle feedback retrieval for users with no feedback', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            // Mock empty results
            mockRepository.find.mockResolvedValueOnce([]);

            // Retrieve feedback for user with no feedback
            const retrieved = await service.getUserFeedback(userId);

            // Should return empty array, not throw error
            expect(retrieved).toBeDefined();
            expect(Array.isArray(retrieved)).toBe(true);
            expect(retrieved.length).toBe(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
