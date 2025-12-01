import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';
import { LearningService } from './learning.service';
import { Roadmap } from '../../entities/roadmap.entity';
import { Milestone } from '../../entities/milestone.entity';
import { Progress } from '../../entities/progress.entity';
import { AIService } from '../ai/ai.service';
import { SkillLevel, GenerateRoadmapDto } from './dto/generate-roadmap.dto';
import { ProgressStatus } from './dto/update-progress.dto';
import { skillLevelArbitrary, learningGoalsArbitrary } from '../../test/generators';

describe('LearningService', () => {
  let service: LearningService;

  const mockRoadmapRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockMilestoneRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockProgressRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockAIService = {
    chat: jest.fn(),
  };

  const mockReminderQueue = {
    add: jest.fn(),
    getJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningService,
        {
          provide: getRepositoryToken(Roadmap),
          useValue: mockRoadmapRepository,
        },
        {
          provide: getRepositoryToken(Milestone),
          useValue: mockMilestoneRepository,
        },
        {
          provide: getRepositoryToken(Progress),
          useValue: mockProgressRepository,
        },
        {
          provide: AIService,
          useValue: mockAIService,
        },
        {
          provide: 'BullQueue_learning-reminders',
          useValue: mockReminderQueue,
        },
      ],
    }).compile();

    service = module.get<LearningService>(LearningService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Feature: techmate-ai-platform, Property 6: Roadmap generation completeness**
   * **Validates: Requirements 2.1**
   * 
   * For any valid learning goals and skill level, the generated roadmap should contain
   * topics, milestones, and resources.
   */
  describe('Property 6: Roadmap generation completeness', () => {
    it('should generate complete roadmaps with topics, milestones, and resources', async () => {
      await fc.assert(
        fc.asyncProperty(
          learningGoalsArbitrary,
          skillLevelArbitrary,
          fc.uuid(),
          async (goals, skillLevel, userId) => {
            // Mock AI response with valid roadmap structure
            const mockAIResponse = {
              content: JSON.stringify({
                title: `Learning Path for ${goals[0]}`,
                description: 'A comprehensive learning roadmap',
                milestones: [
                  {
                    title: 'Milestone 1',
                    description: 'First milestone description',
                    topics: ['Topic 1', 'Topic 2', 'Topic 3'],
                    resources: [
                      {
                        title: 'Resource 1',
                        url: 'https://example.com/resource1',
                        type: 'article',
                      },
                      {
                        title: 'Resource 2',
                        url: 'https://example.com/resource2',
                        type: 'video',
                      },
                    ],
                    order: 1,
                  },
                  {
                    title: 'Milestone 2',
                    description: 'Second milestone description',
                    topics: ['Topic 4', 'Topic 5'],
                    resources: [
                      {
                        title: 'Resource 3',
                        url: 'https://example.com/resource3',
                        type: 'course',
                      },
                    ],
                    order: 2,
                  },
                ],
              }),
            };

            mockAIService.chat.mockResolvedValue(mockAIResponse);

            // Mock repository responses
            const savedRoadmap = {
              id: fc.sample(fc.uuid(), 1)[0],
              userId,
              title: `Learning Path for ${goals[0]}`,
              description: 'A comprehensive learning roadmap',
              active: true,
              createdAt: new Date(),
            };

            mockRoadmapRepository.create.mockReturnValue(savedRoadmap);
            mockRoadmapRepository.save.mockResolvedValue(savedRoadmap);

            const milestones = [
              {
                id: fc.sample(fc.uuid(), 1)[0],
                roadmapId: savedRoadmap.id,
                title: 'Milestone 1',
                description: 'First milestone description',
                topics: ['Topic 1', 'Topic 2', 'Topic 3'],
                resources: [
                  {
                    title: 'Resource 1',
                    url: 'https://example.com/resource1',
                    type: 'article',
                  },
                  {
                    title: 'Resource 2',
                    url: 'https://example.com/resource2',
                    type: 'video',
                  },
                ],
                order: 1,
                completed: false,
              },
              {
                id: fc.sample(fc.uuid(), 1)[0],
                roadmapId: savedRoadmap.id,
                title: 'Milestone 2',
                description: 'Second milestone description',
                topics: ['Topic 4', 'Topic 5'],
                resources: [
                  {
                    title: 'Resource 3',
                    url: 'https://example.com/resource3',
                    type: 'course',
                  },
                ],
                order: 2,
                completed: false,
              },
            ];

            mockMilestoneRepository.create.mockImplementation((data) => data);
            mockMilestoneRepository.save.mockResolvedValue(milestones);

            const completeRoadmap = {
              ...savedRoadmap,
              milestones,
            };

            mockRoadmapRepository.findOne.mockResolvedValue(completeRoadmap);

            // Mock the reminder queue
            mockReminderQueue.add.mockClear();
            mockReminderQueue.add.mockResolvedValue({});

            // Execute the service method
            const dto: GenerateRoadmapDto = {
              goals,
              skillLevel: skillLevel as SkillLevel,
            };
            const result = await service.generateRoadmap(userId, dto);

            // Property assertions: roadmap must contain topics, milestones, and resources
            expect(result).toBeDefined();
            expect(result.title).toBeDefined();
            expect(result.title.length).toBeGreaterThan(0);
            
            // Must have milestones
            expect(result.milestones).toBeDefined();
            expect(Array.isArray(result.milestones)).toBe(true);
            expect(result.milestones.length).toBeGreaterThan(0);

            // Each milestone must have topics and resources
            result.milestones.forEach((milestone) => {
              // Must have topics
              expect(milestone.topics).toBeDefined();
              expect(Array.isArray(milestone.topics)).toBe(true);
              expect(milestone.topics.length).toBeGreaterThan(0);

              // Must have resources
              expect(milestone.resources).toBeDefined();
              expect(Array.isArray(milestone.resources)).toBe(true);
              
              // Each resource must have required fields
              milestone.resources.forEach((resource) => {
                expect(resource.title).toBeDefined();
                expect(resource.url).toBeDefined();
                expect(resource.type).toBeDefined();
                expect(['article', 'video', 'course', 'documentation']).toContain(
                  resource.type,
                );
              });
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 7: Concept explanation non-empty**
   * **Validates: Requirements 2.2**
   * 
   * For any concept explanation request, the AI Agent should return a non-empty response.
   */
  describe('Property 7: Concept explanation non-empty', () => {
    it('should return non-empty explanations for any concept', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.uuid(),
          fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
          async (concept, userId, context) => {
            // Mock AI response
            const mockExplanation = `This is an explanation of ${concept}. It covers the definition, importance, examples, and use cases.`;
            mockAIService.chat.mockResolvedValue({ content: mockExplanation });

            // Mock roadmap lookup
            mockRoadmapRepository.findOne.mockResolvedValue(null);

            // Execute the service method
            const result = await service.explainConcept(userId, {
              concept,
              context,
            });

            // Property assertion: explanation must be non-empty
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 8: Weekly reminders for active roadmaps**
   * **Validates: Requirements 2.3**
   * 
   * For any user with an active learning roadmap, when a week begins, a reminder should be sent.
   */
  describe('Property 8: Weekly reminders for active roadmaps', () => {
    it('should schedule weekly reminders for active roadmaps', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          async (userId, roadmapId) => {
            // Reset mock
            mockReminderQueue.add.mockClear();
            mockReminderQueue.add.mockResolvedValue({});

            // Execute the service method
            await service.scheduleWeeklyReminder(userId, roadmapId);

            // Property assertion: reminder should be scheduled
            expect(mockReminderQueue.add).toHaveBeenCalledWith(
              'weekly-reminder',
              { userId, roadmapId },
              expect.objectContaining({
                repeat: expect.objectContaining({
                  cron: '0 9 * * 1', // Every Monday at 9 AM
                }),
                jobId: `weekly-reminder-${userId}-${roadmapId}`,
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 10: Tech news returns summaries**
   * **Validates: Requirements 2.5**
   * 
   * For any tech news request, the system should return at least one summarized article.
   */
  describe('Property 10: Tech news returns summaries', () => {
    it('should return at least one news summary for any request', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(
            fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
              minLength: 1,
              maxLength: 5,
            }),
            { nil: undefined },
          ),
          async (topics) => {
            // Mock AI response with news items
            const mockNewsResponse = {
              content: JSON.stringify([
                {
                  title: 'Breaking Tech News',
                  summary: 'This is a summary of the latest tech news.',
                  source: 'TechCrunch',
                },
                {
                  title: 'Another Tech Update',
                  summary: 'More exciting developments in technology.',
                  source: 'The Verge',
                },
              ]),
            };

            mockAIService.chat.mockResolvedValue(mockNewsResponse);

            // Execute the service method
            const result = await service.getTechNews({ topics });

            // Property assertion: must return at least one news item
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);

            // Each news item must have required fields
            result.forEach((item) => {
              expect(item.title).toBeDefined();
              expect(typeof item.title).toBe('string');
              expect(item.title.length).toBeGreaterThan(0);

              expect(item.summary).toBeDefined();
              expect(typeof item.summary).toBe('string');

              expect(item.source).toBeDefined();
              expect(typeof item.source).toBe('string');

              expect(item.url).toBeDefined();
              expect(item.publishedAt).toBeDefined();
              expect(item.publishedAt).toBeInstanceOf(Date);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 9: Milestone completion persistence**
   * **Validates: Requirements 2.4**
   * 
   * For any milestone completion, retrieving the progress should show the milestone
   * as completed with a timestamp.
   */
  describe('Property 9: Milestone completion persistence', () => {
    it('should persist milestone completion with timestamp', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          async (userId, milestoneId) => {
            // Mock milestone exists
            const milestone = {
              id: milestoneId,
              title: 'Test Milestone',
              completed: false,
              completedAt: null,
            };
            mockMilestoneRepository.findOne.mockResolvedValue(milestone);

            // Mock progress record
            const progress = {
              id: fc.sample(fc.uuid(), 1)[0],
              userId,
              milestoneId,
              status: 'not_started',
              lastAccessedAt: new Date(),
            };
            mockProgressRepository.findOne.mockResolvedValue(null);
            mockProgressRepository.create.mockReturnValue(progress);

            const savedProgress = {
              ...progress,
              status: 'completed',
              lastAccessedAt: new Date(),
            };
            mockProgressRepository.save.mockResolvedValue(savedProgress);

            const updatedMilestone = {
              ...milestone,
              completed: true,
              completedAt: new Date(),
            };
            mockMilestoneRepository.save.mockResolvedValue(updatedMilestone);

            // Execute the service method
            const result = await service.updateProgress(userId, milestoneId, {
              status: ProgressStatus.COMPLETED,
            });

            // Property assertions: completed progress must have timestamp
            expect(result).toBeDefined();
            expect(result.status).toBe('completed');
            expect(result.lastAccessedAt).toBeDefined();
            expect(result.lastAccessedAt).toBeInstanceOf(Date);

            // Verify milestone was updated
            expect(mockMilestoneRepository.save).toHaveBeenCalledWith(
              expect.objectContaining({
                completed: true,
                completedAt: expect.any(Date),
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
