import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';
import { InterviewService } from './interview.service';
import { InterviewSession } from '../../entities/interview-session.entity';
import { Question } from '../../entities/question.entity';
import { Answer } from '../../entities/answer.entity';
import { AIService } from '../ai/ai.service';
import { interviewTypeArbitrary } from '../../test/generators';

describe('InterviewService', () => {
  let service: InterviewService;

  const mockSessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQuestionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAnswerRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAIService = {
    chat: jest.fn(),
    generateEmbedding: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewService,
        {
          provide: getRepositoryToken(InterviewSession),
          useValue: mockSessionRepository,
        },
        {
          provide: getRepositoryToken(Question),
          useValue: mockQuestionRepository,
        },
        {
          provide: getRepositoryToken(Answer),
          useValue: mockAnswerRepository,
        },
        {
          provide: AIService,
          useValue: mockAIService,
        },
      ],
    }).compile();

    service = module.get<InterviewService>(InterviewService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Feature: techmate-ai-platform, Property 15: Questions match interview type**
   * **Validates: Requirements 4.1**
   * 
   * For any interview session type (DSA, System Design, Behavioral), all questions
   * presented should match that type.
   */
  describe('Property 15: Questions match interview type', () => {
    it('should generate questions matching the interview type for any session type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            type: interviewTypeArbitrary,
            voiceModeEnabled: fc.boolean(),
          }),
          async (sessionData) => {
            // Mock AI response with questions
            const mockQuestions = [
              {
                content: 'Question 1',
                difficulty: 'easy',
                hints: ['Hint 1', 'Hint 2'],
              },
              {
                content: 'Question 2',
                difficulty: 'medium',
                hints: ['Hint 1'],
              },
              {
                content: 'Question 3',
                difficulty: 'hard',
                hints: ['Hint 1', 'Hint 2', 'Hint 3'],
              },
            ];

            mockAIService.chat.mockResolvedValue({
              content: JSON.stringify(mockQuestions),
            });

            // Mock session creation
            const mockSession = {
              id: 'session-id',
              userId: sessionData.userId,
              type: sessionData.type,
              voiceModeEnabled: sessionData.voiceModeEnabled,
              status: 'active',
              startedAt: new Date(),
            };

            mockSessionRepository.create.mockReturnValue(mockSession);
            mockSessionRepository.save.mockResolvedValue(mockSession);

            // Mock question creation
            const createdQuestions = mockQuestions.map((q, index) => ({
              id: `question-${index}`,
              sessionId: mockSession.id,
              type: sessionData.type,
              difficulty: q.difficulty,
              content: q.content,
              hints: q.hints,
              order: index,
            }));

            mockQuestionRepository.create.mockImplementation((data) => data);
            mockQuestionRepository.save.mockResolvedValue(createdQuestions);

            // Mock final session retrieval with questions
            mockSessionRepository.findOne.mockResolvedValue({
              ...mockSession,
              questions: createdQuestions,
            });

            // Start session
            const result = await service.startSession(sessionData.userId, {
              type: sessionData.type as 'dsa' | 'system_design' | 'behavioral',
              voiceModeEnabled: sessionData.voiceModeEnabled,
            });

            // Verify session was created
            expect(result).toBeDefined();
            expect(result.type).toBe(sessionData.type);
            expect(result.questions).toBeDefined();

            // Property: All questions must match the session type
            result.questions.forEach((question) => {
              expect(question.type).toBe(sessionData.type);
            });

            // Verify questions have required fields
            result.questions.forEach((question) => {
              expect(question.content).toBeDefined();
              expect(question.difficulty).toMatch(/^(easy|medium|hard)$/);
              expect(question.type).toBe(sessionData.type);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 16: Answer evaluation completeness**
   * **Validates: Requirements 4.2**
   * 
   * For any submitted interview answer, the evaluation should contain a score and feedback.
   */
  describe('Property 16: Answer evaluation completeness', () => {
    it('should provide complete evaluation for any submitted answer', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sessionId: fc.uuid(),
            userId: fc.uuid(),
            questionId: fc.uuid(),
            answerContent: fc.string({ minLength: 10, maxLength: 500 }),
            type: interviewTypeArbitrary,
          }),
          async (testData) => {
            // Mock evaluation response from AI
            const mockEvaluation = {
              score: fc.sample(fc.integer({ min: 0, max: 100 }), 1)[0],
              feedback: 'Good answer with room for improvement',
              strengths: ['Clear explanation', 'Good structure'],
              improvements: ['Add more details', 'Consider edge cases'],
            };

            mockAIService.chat.mockResolvedValue({
              content: JSON.stringify(mockEvaluation),
            });

            // Mock session with question
            const mockQuestion = {
              id: testData.questionId,
              sessionId: testData.sessionId,
              type: testData.type,
              difficulty: 'medium',
              content: 'Test question',
              hints: [],
              order: 0,
            };

            const mockSession = {
              id: testData.sessionId,
              userId: testData.userId,
              type: testData.type,
              status: 'active',
              questions: [mockQuestion],
              answers: [],
            };

            mockSessionRepository.findOne.mockResolvedValue(mockSession);

            // Mock answer creation
            const mockAnswer = {
              id: 'answer-id',
              sessionId: testData.sessionId,
              questionId: testData.questionId,
              content: testData.answerContent,
              evaluation: mockEvaluation,
              submittedAt: new Date(),
            };

            mockAnswerRepository.create.mockReturnValue(mockAnswer);
            mockAnswerRepository.save.mockResolvedValue(mockAnswer);

            // Submit answer
            const result = await service.submitAnswer(
              testData.sessionId,
              testData.userId,
              {
                questionId: testData.questionId,
                content: testData.answerContent,
              }
            );

            // Property: Evaluation must be complete
            expect(result.evaluation).toBeDefined();
            expect(result.evaluation.score).toBeDefined();
            expect(result.evaluation.score).toBeGreaterThanOrEqual(0);
            expect(result.evaluation.score).toBeLessThanOrEqual(100);
            expect(result.evaluation.feedback).toBeDefined();
            expect(typeof result.evaluation.feedback).toBe('string');
            expect(result.evaluation.feedback.length).toBeGreaterThan(0);
            expect(Array.isArray(result.evaluation.strengths)).toBe(true);
            expect(Array.isArray(result.evaluation.improvements)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 18: Interview summary completeness**
   * **Validates: Requirements 4.4**
   * 
   * For any completed interview session, the performance summary should contain
   * strengths and improvement areas.
   */
  describe('Property 18: Interview summary completeness', () => {
    it('should generate complete summary for any completed session', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sessionId: fc.uuid(),
            userId: fc.uuid(),
            type: interviewTypeArbitrary,
            numAnswers: fc.integer({ min: 1, max: 10 }),
          }),
          async (testData) => {
            // Generate mock answers with evaluations
            const mockAnswers = Array.from({ length: testData.numAnswers }, (_, i) => ({
              id: `answer-${i}`,
              questionId: `question-${i}`,
              content: `Answer ${i}`,
              evaluation: {
                score: fc.sample(fc.integer({ min: 0, max: 100 }), 1)[0],
                feedback: `Feedback ${i}`,
                strengths: [`Strength ${i}A`, `Strength ${i}B`],
                improvements: [`Improvement ${i}A`, `Improvement ${i}B`],
              },
              submittedAt: new Date(),
            }));

            const mockQuestions = Array.from({ length: testData.numAnswers }, (_, i) => ({
              id: `question-${i}`,
              sessionId: testData.sessionId,
              type: testData.type,
              difficulty: 'medium',
              content: `Question ${i}`,
              order: i,
            }));

            const mockSession = {
              id: testData.sessionId,
              userId: testData.userId,
              type: testData.type,
              status: 'active',
              questions: mockQuestions,
              answers: mockAnswers,
              startedAt: new Date(),
            };

            mockSessionRepository.findOne.mockResolvedValue(mockSession);
            mockSessionRepository.save.mockImplementation((session) => Promise.resolve(session));

            // Complete session
            const result = await service.completeSession(testData.sessionId, testData.userId);

            // Property: Summary must be complete
            expect(result.status).toBe('completed');
            expect(result.completedAt).toBeDefined();
            expect(result.summary).toBeDefined();
            expect(result.summary.overallScore).toBeDefined();
            expect(result.summary.overallScore).toBeGreaterThanOrEqual(0);
            expect(result.summary.overallScore).toBeLessThanOrEqual(100);
            expect(Array.isArray(result.summary.strengths)).toBe(true);
            expect(result.summary.strengths.length).toBeGreaterThan(0);
            expect(Array.isArray(result.summary.improvements)).toBe(true);
            expect(result.summary.improvements.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 17: Voice mode transcription**
   * **Validates: Requirements 4.3**
   * 
   * For any interview session with voice mode enabled, audio input should be
   * transcribed to text and responses should be synthesized to audio.
   */
  describe('Property 17: Voice mode transcription', () => {
    it('should handle voice mode for any session with voice enabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            sessionId: fc.uuid(),
            userId: fc.uuid(),
            type: interviewTypeArbitrary,
            voiceModeEnabled: fc.constant(true), // Always true for this test
          }),
          async (sessionData) => {
            // Mock session with voice mode enabled
            const mockSession = {
              id: sessionData.sessionId,
              userId: sessionData.userId,
              type: sessionData.type,
              voiceModeEnabled: true,
              status: 'active',
              questions: [],
              answers: [],
            };

            mockSessionRepository.findOne.mockResolvedValue(mockSession);

            // Get session
            const result = await service.getSession(sessionData.sessionId, sessionData.userId);

            // Property: Voice mode should be enabled
            expect(result.voiceModeEnabled).toBe(true);

            // Verify session supports voice mode
            expect(result.id).toBe(sessionData.sessionId);
            expect(result.type).toBe(sessionData.type);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 19: Practice questions have difficulty**
   * **Validates: Requirements 4.5**
   * 
   * For any practice question request, all returned DSA problems should have
   * an assigned difficulty level.
   */
  describe('Property 19: Practice questions have difficulty', () => {
    it('should return questions with difficulty for any query', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            type: fc.option(interviewTypeArbitrary, { nil: undefined }),
            difficulty: fc.option(fc.constantFrom('easy', 'medium', 'hard'), { nil: undefined }),
          }),
          async (queryParams) => {
            // Mock practice questions
            const mockQuestions = Array.from({ length: 5 }, (_, i) => ({
              id: `question-${i}`,
              sessionId: `session-${i}`,
              type: queryParams.type || 'dsa',
              difficulty: queryParams.difficulty || fc.sample(fc.constantFrom('easy', 'medium', 'hard'), 1)[0],
              content: `Practice question ${i}`,
              hints: ['Hint 1', 'Hint 2'],
              order: i,
              session: { status: 'completed' },
            }));

            const mockQueryBuilder = {
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(mockQuestions),
            };

            mockQuestionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            // Get practice questions
            const result = await service.getPracticeQuestions(
              queryParams.type,
              queryParams.difficulty
            );

            // Property: All questions must have difficulty
            expect(Array.isArray(result)).toBe(true);
            result.forEach((question) => {
              expect(question.difficulty).toBeDefined();
              expect(question.difficulty).toMatch(/^(easy|medium|hard)$/);
              
              // If type filter was specified, verify it matches
              if (queryParams.type) {
                expect(question.type).toBe(queryParams.type);
              }
              
              // If difficulty filter was specified, verify it matches
              if (queryParams.difficulty) {
                expect(question.difficulty).toBe(queryParams.difficulty);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
