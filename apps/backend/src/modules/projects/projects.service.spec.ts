import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';
import { ProjectsService } from './projects.service';
import { GitHubService } from './github.service';
import { ProjectIdea } from '../../entities/project-idea.entity';
import { ProjectArchitecture } from '../../entities/project-architecture.entity';
import { CodeFile } from '../../entities/code-file.entity';
import { AIService } from '../ai/ai.service';
import { ProjectDifficulty } from './dto/generate-ideas.dto';
import {
  projectDifficultyArbitrary,
  projectTechnologiesArbitrary,
} from '../../test/generators';

// Mock the @octokit/rest module
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    users: {
      getAuthenticated: jest.fn(),
    },
    repos: {
      createForAuthenticatedUser: jest.fn(),
      createOrUpdateFileContents: jest.fn(),
    },
  })),
}));

describe('ProjectsService', () => {
  let service: ProjectsService;

  const mockProjectIdeaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockArchitectureRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockCodeFileRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockAIService = {
    chat: jest.fn(),
  };

  const mockGitHubService = {
    createRepository: jest.fn(),
    uploadFiles: jest.fn(),
    generateReadme: jest.fn(),
    sanitizeRepositoryName: jest.fn(),
    getAuthenticatedUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(ProjectIdea),
          useValue: mockProjectIdeaRepository,
        },
        {
          provide: getRepositoryToken(ProjectArchitecture),
          useValue: mockArchitectureRepository,
        },
        {
          provide: getRepositoryToken(CodeFile),
          useValue: mockCodeFileRepository,
        },
        {
          provide: AIService,
          useValue: mockAIService,
        },
        {
          provide: GitHubService,
          useValue: mockGitHubService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Feature: techmate-ai-platform, Property 13: Generated code is syntactically valid**
   * **Validates: Requirements 3.3**
   *
   * For any project architecture, the generated starter code should be parseable
   * and include comments.
   */
  describe('Property 13: Generated code is syntactically valid', () => {
    it('should generate code with comments for all files', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          async (userId, projectIdeaId, architectureId) => {
            // Mock architecture with folder structure
            const mockArchitecture = {
              id: architectureId,
              projectIdeaId,
              projectIdea: {
                id: projectIdeaId,
                userId,
                title: 'Test Project',
                description: 'A test project',
                difficulty: 'intermediate',
                technologies: ['React', 'TypeScript'],
              },
              folderStructure: {
                name: 'project-root',
                type: 'folder',
                children: [
                  {
                    name: 'src',
                    type: 'folder',
                    children: [
                      {
                        name: 'index.ts',
                        type: 'file',
                      },
                      {
                        name: 'App.tsx',
                        type: 'file',
                      },
                    ],
                  },
                  {
                    name: 'README.md',
                    type: 'file',
                  },
                ],
              },
              techStack: {
                frontend: ['React', 'TypeScript'],
              },
              tasks: [],
              dependencies: [],
            };

            mockArchitectureRepository.findOne.mockResolvedValue(
              mockArchitecture,
            );

            // Mock AI responses with code that includes comments
            mockAIService.chat.mockImplementation(async (messages) => {
              const prompt = messages[1].content;
              if (prompt.includes('index.ts')) {
                return {
                  content: `// Main entry point\nimport React from 'react';\n\n// Initialize app\nconst app = () => {};\n\nexport default app;`,
                };
              } else if (prompt.includes('App.tsx')) {
                return {
                  content: `// App component\nimport React from 'react';\n\n// Main application component\nconst App = () => {\n  return <div>Hello</div>;\n};\n\nexport default App;`,
                };
              } else {
                return {
                  content: `# Project README\n\nThis is a test project.`,
                };
              }
            });

            // Mock code file creation
            const mockCodeFiles = [
              {
                id: fc.sample(fc.uuid(), 1)[0],
                architectureId,
                path: 'project-root/src/index.ts',
                content: '// Main entry point\nimport React from \'react\';\n\nconst app = () => {};\n\nexport default app;',
                language: 'typescript',
                createdAt: new Date(),
              },
              {
                id: fc.sample(fc.uuid(), 1)[0],
                architectureId,
                path: 'project-root/src/App.tsx',
                content: '// App component\nimport React from \'react\';\n\nconst App = () => {\n  return <div>Hello</div>;\n};\n\nexport default App;',
                language: 'typescript',
                createdAt: new Date(),
              },
              {
                id: fc.sample(fc.uuid(), 1)[0],
                architectureId,
                path: 'project-root/README.md',
                content: '# Project README\n\nThis is a test project.',
                language: 'markdown',
                createdAt: new Date(),
              },
            ];

            mockCodeFileRepository.create.mockImplementation((data) => data);
            mockCodeFileRepository.save.mockResolvedValue(mockCodeFiles);

            // Execute the service method
            const result = await service.generateStarterCode(
              architectureId,
              userId,
            );

            // Property assertions: all code files must have comments
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);

            result.forEach((codeFile) => {
              // Must have required fields
              expect(codeFile.path).toBeDefined();
              expect(codeFile.content).toBeDefined();
              expect(codeFile.language).toBeDefined();

              // Content must not be empty
              expect(codeFile.content.length).toBeGreaterThan(0);

              // Code should include comments (basic check for comment characters)
              const hasComments =
                codeFile.content.includes('//') ||
                codeFile.content.includes('/*') ||
                codeFile.content.includes('#') ||
                codeFile.content.includes('<!--');

              expect(hasComments).toBe(true);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 12: Architecture completeness**
   * **Validates: Requirements 3.2**
   *
   * For any project idea, the generated architecture should contain folder structure,
   * task breakdown, and technology stack.
   */
  describe('Property 12: Architecture completeness', () => {
    it('should generate complete architecture with all required components', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          projectDifficultyArbitrary,
          projectTechnologiesArbitrary,
          async (userId, projectIdeaId, difficulty, technologies) => {
            // Mock project idea
            const mockProjectIdea = {
              id: projectIdeaId,
              userId,
              title: 'Test Project',
              description: 'A test project',
              difficulty,
              technologies,
              estimatedHours: 20,
              createdAt: new Date(),
            };

            mockProjectIdeaRepository.findOne.mockResolvedValue(
              mockProjectIdea,
            );

            // Mock AI response with complete architecture
            const mockArchitecture = {
              folderStructure: {
                name: 'project-root',
                type: 'folder',
                children: [
                  {
                    name: 'src',
                    type: 'folder',
                    children: [
                      {
                        name: 'index.ts',
                        type: 'file',
                      },
                    ],
                  },
                ],
              },
              techStack: {
                frontend: ['React', 'TypeScript'],
                backend: ['Node.js', 'Express'],
                database: ['PostgreSQL'],
                devOps: ['Docker'],
              },
              tasks: [
                {
                  id: '1',
                  title: 'Setup project',
                  description: 'Initialize project structure',
                  order: 1,
                },
                {
                  id: '2',
                  title: 'Implement features',
                  description: 'Build core functionality',
                  order: 2,
                },
              ],
              dependencies: [
                {
                  name: 'react',
                  version: '^18.0.0',
                  type: 'production',
                },
              ],
            };

            const mockAIResponse = {
              content: JSON.stringify(mockArchitecture),
            };

            mockAIService.chat.mockResolvedValue(mockAIResponse);

            // Mock repository responses
            const savedArchitecture = {
              id: fc.sample(fc.uuid(), 1)[0],
              projectIdeaId,
              ...mockArchitecture,
              createdAt: new Date(),
            };

            mockArchitectureRepository.create.mockReturnValue(
              savedArchitecture,
            );
            mockArchitectureRepository.save.mockResolvedValue(
              savedArchitecture,
            );

            // Execute the service method
            const result = await service.generateArchitecture(
              projectIdeaId,
              userId,
            );

            // Property assertions: architecture must be complete
            expect(result).toBeDefined();

            // Must have folder structure
            expect(result.folderStructure).toBeDefined();
            expect(result.folderStructure.name).toBeDefined();
            expect(result.folderStructure.type).toBeDefined();

            // Must have tech stack
            expect(result.techStack).toBeDefined();
            expect(typeof result.techStack).toBe('object');

            // Must have tasks
            expect(result.tasks).toBeDefined();
            expect(Array.isArray(result.tasks)).toBe(true);
            expect(result.tasks.length).toBeGreaterThan(0);

            // Each task must have required fields
            result.tasks.forEach((task) => {
              expect(task.id).toBeDefined();
              expect(task.title).toBeDefined();
              expect(task.description).toBeDefined();
              expect(task.order).toBeDefined();
            });

            // Must have dependencies
            expect(result.dependencies).toBeDefined();
            expect(Array.isArray(result.dependencies)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 11: Project ideas match criteria**
   * **Validates: Requirements 3.1**
   *
   * For any project difficulty and technology preferences, all generated project ideas
   * should match the specified difficulty and include the requested technologies.
   */
  describe('Property 11: Project ideas match criteria', () => {
    it('should generate project ideas matching difficulty and technologies', async () => {
      await fc.assert(
        fc.asyncProperty(
          projectDifficultyArbitrary,
          projectTechnologiesArbitrary,
          fc.uuid(),
          fc.integer({ min: 1, max: 5 }),
          async (difficulty, technologies, userId, count) => {
            // Mock AI response with project ideas
            const mockIdeas = Array.from({ length: count }, (_, i) => ({
              title: `Project ${i + 1}`,
              description: `A ${difficulty} level project using ${technologies.join(', ')}`,
              difficulty,
              technologies: [...technologies],
              estimatedHours: difficulty === 'beginner' ? 10 : difficulty === 'intermediate' ? 20 : 40,
            }));

            const mockAIResponse = {
              content: JSON.stringify({
                ideas: mockIdeas,
              }),
            };

            mockAIService.chat.mockResolvedValue(mockAIResponse);

            // Mock repository responses
            const savedIdeas = mockIdeas.map((idea) => ({
              id: fc.sample(fc.uuid(), 1)[0],
              userId,
              ...idea,
              createdAt: new Date(),
            }));

            mockProjectIdeaRepository.create.mockImplementation((data) => data);
            mockProjectIdeaRepository.save.mockResolvedValue(savedIdeas);

            // Execute the service method
            const result = await service.generateIdeas(userId, {
              difficulty: difficulty as ProjectDifficulty,
              technologies,
              count,
            });

            // Property assertions: all ideas must match criteria
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);

            result.forEach((idea) => {
              // Must match difficulty
              expect(idea.difficulty).toBe(difficulty);

              // Must include all requested technologies
              technologies.forEach((tech) => {
                const hasTech = idea.technologies.some(
                  (t) => t.toLowerCase() === tech.toLowerCase(),
                );
                expect(hasTech).toBe(true);
              });

              // Must have required fields
              expect(idea.title).toBeDefined();
              expect(idea.title.length).toBeGreaterThan(0);
              expect(idea.description).toBeDefined();
              expect(idea.description.length).toBeGreaterThan(0);
              expect(idea.estimatedHours).toBeGreaterThan(0);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: techmate-ai-platform, Property 14: GitHub export creates repository**
   * **Validates: Requirements 3.4**
   *
   * For any project with generated files, exporting to GitHub should create a repository
   * containing all files and documentation.
   */
  describe('Property 14: GitHub export creates repository', () => {
    it('should create GitHub repository with all files and documentation', async () => {
      // Generator for valid file paths (non-empty, non-whitespace)
      const validFilePathArbitrary = fc
        .tuple(
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), {
            minLength: 1,
            maxLength: 20,
          }),
          fc.constantFrom('ts', 'tsx', 'js', 'jsx', 'py', 'java', 'go'),
        )
        .map(([name, ext]) => `src/${name}.${ext}`);

      // Generator for valid file content (non-empty, non-whitespace)
      const validContentArbitrary = fc
        .stringOf(
          fc.constantFrom(
            ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 \n'.split(
              '',
            ),
          ),
          { minLength: 10, maxLength: 500 },
        )
        .filter((s) => s.trim().length > 0);

      // Generator for valid project titles (non-empty, non-whitespace)
      const validTitleArbitrary = fc
        .stringOf(
          fc.constantFrom(
            ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '.split(
              '',
            ),
          ),
          { minLength: 1, maxLength: 50 },
        )
        .filter((s) => s.trim().length > 0);

      // Generator for valid descriptions (non-empty, non-whitespace)
      const validDescriptionArbitrary = fc
        .stringOf(
          fc.constantFrom(
            ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .'.split(
              '',
            ),
          ),
          { minLength: 10, maxLength: 200 },
        )
        .filter((s) => s.trim().length > 0);

      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          validTitleArbitrary,
          validDescriptionArbitrary,
          fc.boolean(),
          projectTechnologiesArbitrary,
          fc.array(
            fc.record({
              path: validFilePathArbitrary,
              content: validContentArbitrary,
            }),
            { minLength: 1, maxLength: 10 },
          ),
          async (
            userId,
            projectIdeaId,
            architectureId,
            projectTitle,
            projectDescription,
            isPrivate,
            technologies,
            codeFiles,
          ) => {
            // Mock architecture with project idea
            const mockArchitecture = {
              id: architectureId,
              projectIdeaId,
              projectIdea: {
                id: projectIdeaId,
                userId,
                title: projectTitle,
                description: projectDescription,
                difficulty: 'intermediate',
                technologies,
              },
              folderStructure: {
                name: 'project-root',
                type: 'folder',
                children: [],
              },
              techStack: {
                frontend: technologies.slice(0, 2),
                backend: technologies.slice(2, 4),
              },
              tasks: [
                {
                  id: '1',
                  title: 'Setup project',
                  description: 'Initialize project structure',
                  order: 1,
                },
              ],
              dependencies: [],
            };

            mockArchitectureRepository.findOne.mockResolvedValue(
              mockArchitecture,
            );

            // Mock code files
            const mockCodeFiles = codeFiles.map((file) => ({
              id: fc.sample(fc.uuid(), 1)[0],
              architectureId,
              path: file.path,
              content: file.content,
              language: 'typescript',
              createdAt: new Date(),
            }));

            // Mock the find method to return code files for this specific call
            mockCodeFileRepository.find.mockResolvedValueOnce(mockCodeFiles);

            // Mock GitHub service responses
            const mockOwner = 'test-user';
            const mockRepo = 'test-repo';
            const mockUrl = `https://github.com/${mockOwner}/${mockRepo}`;

            mockGitHubService.sanitizeRepositoryName.mockReturnValue(mockRepo);
            mockGitHubService.createRepository.mockResolvedValue({
              owner: mockOwner,
              repo: mockRepo,
              url: mockUrl,
            });
            mockGitHubService.generateReadme.mockReturnValue(
              `# ${projectTitle}\n\n${projectDescription}`,
            );
            mockGitHubService.uploadFiles.mockResolvedValue(undefined);

            // Execute the service method
            const result = await service.exportToGitHub(
              architectureId,
              userId,
              'fake-github-token',
              undefined,
              undefined,
              isPrivate,
            );

            // Property assertions: repository must be created with all files
            expect(result).toBeDefined();

            // Must return repository information
            expect(result.repositoryUrl).toBeDefined();
            expect(result.repositoryUrl).toBe(mockUrl);
            expect(result.owner).toBeDefined();
            expect(result.owner).toBe(mockOwner);
            expect(result.repo).toBeDefined();
            expect(result.repo).toBe(mockRepo);

            // Verify GitHub service was called correctly
            expect(mockGitHubService.createRepository).toHaveBeenCalledWith(
              'fake-github-token',
              mockRepo,
              projectDescription,
              isPrivate,
            );

            // Verify README was generated
            expect(mockGitHubService.generateReadme).toHaveBeenCalledWith(
              projectTitle,
              projectDescription,
              expect.any(Array),
              expect.any(Array),
            );

            // Verify files were uploaded
            expect(mockGitHubService.uploadFiles).toHaveBeenCalledWith(
              'fake-github-token',
              mockOwner,
              mockRepo,
              expect.arrayContaining([
                expect.objectContaining({
                  path: 'README.md',
                  content: expect.any(String),
                }),
              ]),
            );

            // Verify files were uploaded to GitHub
            expect(mockGitHubService.uploadFiles).toHaveBeenCalled();
            const uploadCall = mockGitHubService.uploadFiles.mock.calls[0];
            const uploadedFiles = uploadCall[3];

            // Verify uploadedFiles is an array with content
            expect(Array.isArray(uploadedFiles)).toBe(true);
            expect(uploadedFiles.length).toBeGreaterThan(0);

            // Must include README.md
            const hasReadme = uploadedFiles.some(
              (file: any) => file.path === 'README.md',
            );
            expect(hasReadme).toBe(true);

            // Must include at least one code file (not just README)
            const codeFileCount = uploadedFiles.filter(
              (file: any) => file.path !== 'README.md',
            ).length;
            expect(codeFileCount).toBeGreaterThan(0);

            // All uploaded files must have path and content
            uploadedFiles.forEach((file: any) => {
              expect(file.path).toBeDefined();
              expect(typeof file.path).toBe('string');
              expect(file.path.length).toBeGreaterThan(0);
              expect(file.content).toBeDefined();
              expect(typeof file.content).toBe('string');
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
