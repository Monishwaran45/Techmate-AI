import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectIdea } from '../../entities/project-idea.entity';
import { ProjectArchitecture } from '../../entities/project-architecture.entity';
import { CodeFile } from '../../entities/code-file.entity';
import { AIService } from '../ai/ai.service';
import { GitHubService } from './github.service';
import {
  GenerateIdeasDto,
  ProjectDifficulty,
} from './dto/generate-ideas.dto';

interface ParsedProjectIdea {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  technologies: string[];
  estimatedHours: number;
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(ProjectIdea)
    private readonly projectIdeaRepository: Repository<ProjectIdea>,
    @InjectRepository(ProjectArchitecture)
    private readonly architectureRepository: Repository<ProjectArchitecture>,
    @InjectRepository(CodeFile)
    private readonly codeFileRepository: Repository<CodeFile>,
    private readonly aiService: AIService,
    private readonly githubService: GitHubService,
  ) {}

  /**
   * Generate project ideas based on difficulty and technologies
   */
  async generateIdeas(
    userId: string,
    dto: GenerateIdeasDto,
  ): Promise<ProjectIdea[]> {
    this.logger.log(
      `Generating ${dto.count || 3} project ideas for user ${userId} with difficulty ${dto.difficulty}`,
    );

    const count = dto.count || 3;

    // Create prompt for project idea generation
    const prompt = this.createProjectIdeaPrompt(
      dto.difficulty,
      dto.technologies,
      count,
    );

    // Call AI service to generate ideas
    const response = await this.aiService.chat([
      {
        role: 'system',
        content:
          'You are an expert software project advisor who creates practical, well-scoped project ideas. Always respond with valid JSON only, no additional text.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // Parse and validate the AI response
    const parsedIdeas = this.parseProjectIdeasResponse(response.content);

    // Validate that ideas match the criteria
    this.validateProjectIdeas(parsedIdeas, dto.difficulty, dto.technologies);

    // Create project idea entities
    const projectIdeas = parsedIdeas.map((idea) =>
      this.projectIdeaRepository.create({
        userId,
        title: idea.title,
        description: idea.description,
        difficulty: idea.difficulty,
        technologies: idea.technologies,
        estimatedHours: idea.estimatedHours,
      }),
    );

    // Save project ideas
    const savedIdeas = await this.projectIdeaRepository.save(projectIdeas);

    this.logger.log(
      `Successfully generated ${savedIdeas.length} project ideas`,
    );

    return savedIdeas;
  }

  /**
   * Create a prompt for project idea generation
   */
  private createProjectIdeaPrompt(
    difficulty: ProjectDifficulty,
    technologies: string[],
    count: number,
  ): string {
    const difficultyDescriptions = {
      beginner:
        'suitable for beginners with basic programming knowledge, focusing on fundamental concepts',
      intermediate:
        'suitable for developers with some experience, incorporating multiple technologies and moderate complexity',
      advanced:
        'suitable for experienced developers, involving complex architectures, scalability, and advanced patterns',
    };

    return `Generate ${count} unique project ideas that are ${difficultyDescriptions[difficulty]}.

The projects MUST use the following technologies: ${technologies.join(', ')}

For each project idea, provide:
- A clear, descriptive title
- A detailed description (2-3 sentences) explaining what the project does and its key features
- The difficulty level (must be "${difficulty}")
- A list of technologies to use (must include all of: ${technologies.join(', ')})
- Estimated hours to complete (realistic estimate based on difficulty)

Respond ONLY with valid JSON in this exact format:
{
  "ideas": [
    {
      "title": "Project Title",
      "description": "Detailed description of the project",
      "difficulty": "${difficulty}",
      "technologies": ${JSON.stringify(technologies)},
      "estimatedHours": 20
    }
  ]
}`;
  }

  /**
   * Parse and validate the AI-generated project ideas response
   */
  private parseProjectIdeasResponse(content: string): ParsedProjectIdea[] {
    try {
      this.logger.debug(`Parsing AI response: ${content.substring(0, 500)}...`);
      
      // Try to extract JSON from the response
      let jsonContent = content.trim();

      // Remove markdown code blocks if present
      if (jsonContent.includes('```')) {
        const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
        } else {
          jsonContent = jsonContent.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }
      }

      // Try to find JSON object in the response
      const jsonObjectMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        jsonContent = jsonObjectMatch[0];
      }

      const parsed = JSON.parse(jsonContent);

      // Handle both {ideas: [...]} and direct array format
      let ideas = parsed.ideas || parsed;
      if (!Array.isArray(ideas)) {
        // If it's a single idea object, wrap it in an array
        if (parsed.title && parsed.description) {
          ideas = [parsed];
        } else {
          throw new Error('Invalid project ideas structure');
        }
      }

      // Validate and normalize each idea
      return ideas.map((idea: any, index: number) => {
        if (!idea.title || !idea.description) {
          throw new Error(`Invalid project idea at index ${index}: missing title or description`);
        }
        
        return {
          title: idea.title,
          description: idea.description,
          difficulty: ['beginner', 'intermediate', 'advanced'].includes(idea.difficulty) 
            ? idea.difficulty 
            : 'intermediate',
          technologies: Array.isArray(idea.technologies) ? idea.technologies : [],
          estimatedHours: typeof idea.estimatedHours === 'number' ? idea.estimatedHours : 20,
        };
      });
    } catch (error) {
      this.logger.error('Failed to parse project ideas response', error);
      this.logger.error(`Raw content: ${content}`);
      
      // Return fallback ideas instead of throwing
      return this.getFallbackProjectIdeas();
    }
  }

  /**
   * Get fallback project ideas when AI generation fails
   */
  private getFallbackProjectIdeas(): ParsedProjectIdea[] {
    return [
      {
        title: 'Task Management Dashboard',
        description: 'Build a full-stack task management application with drag-and-drop functionality, user authentication, and real-time updates.',
        difficulty: 'intermediate',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Socket.io'],
        estimatedHours: 40,
      },
      {
        title: 'E-commerce Product Catalog',
        description: 'Create a product catalog with search, filtering, shopping cart, and checkout functionality using modern web technologies.',
        difficulty: 'intermediate',
        technologies: ['React', 'TypeScript', 'Node.js', 'Stripe'],
        estimatedHours: 50,
      },
      {
        title: 'Weather Dashboard App',
        description: 'Build a weather application that displays current conditions and forecasts using a weather API with beautiful visualizations.',
        difficulty: 'beginner',
        technologies: ['React', 'TypeScript', 'REST API', 'Chart.js'],
        estimatedHours: 20,
      },
    ];
  }

  /**
   * Validate that generated ideas match the requested criteria
   */
  private validateProjectIdeas(
    ideas: ParsedProjectIdea[],
    difficulty: ProjectDifficulty,
    technologies: string[],
  ): void {
    ideas.forEach((idea, index) => {
      // Validate difficulty matches
      if (idea.difficulty !== difficulty) {
        this.logger.warn(
          `Project idea ${index} has mismatched difficulty: expected ${difficulty}, got ${idea.difficulty}`,
        );
      }

      // Validate all requested technologies are included
      const missingTechs = technologies.filter(
        (tech) =>
          !idea.technologies.some(
            (t) => t.toLowerCase() === tech.toLowerCase(),
          ),
      );

      if (missingTechs.length > 0) {
        this.logger.warn(
          `Project idea ${index} is missing technologies: ${missingTechs.join(', ')}`,
        );
      }
    });
  }

  /**
   * Get project ideas for a user
   */
  async getUserProjectIdeas(userId: string): Promise<ProjectIdea[]> {
    return this.projectIdeaRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a specific project idea
   */
  async getProjectIdea(id: string, userId: string): Promise<ProjectIdea> {
    const idea = await this.projectIdeaRepository.findOne({
      where: { id, userId },
      relations: ['architecture'],
    });

    if (!idea) {
      throw new NotFoundException('Project idea not found');
    }

    return idea;
  }

  /**
   * Generate architecture for a project idea
   */
  async generateArchitecture(
    projectIdeaId: string,
    userId: string,
  ): Promise<ProjectArchitecture> {
    this.logger.log(
      `Generating architecture for project idea ${projectIdeaId}`,
    );

    // Get the project idea
    const projectIdea = await this.getProjectIdea(projectIdeaId, userId);

    // Create prompt for architecture generation
    const prompt = this.createArchitecturePrompt(projectIdea);

    // Call AI service to generate architecture
    const response = await this.aiService.chat([
      {
        role: 'system',
        content:
          'You are an expert software architect who creates detailed, practical project architectures. Always respond with valid JSON only, no additional text.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // Parse and validate the AI response
    const parsedArchitecture = this.parseArchitectureResponse(response.content);

    // Create architecture entity
    const architecture = this.architectureRepository.create({
      projectIdeaId: projectIdea.id,
      folderStructure: parsedArchitecture.folderStructure,
      techStack: parsedArchitecture.techStack,
      tasks: parsedArchitecture.tasks,
      dependencies: parsedArchitecture.dependencies,
    });

    // Save architecture
    const savedArchitecture =
      await this.architectureRepository.save(architecture);

    this.logger.log(
      `Successfully generated architecture ${savedArchitecture.id}`,
    );

    return savedArchitecture;
  }

  /**
   * Create a prompt for architecture generation
   */
  private createArchitecturePrompt(projectIdea: ProjectIdea): string {
    return `Create a detailed project architecture for the following project:

Title: ${projectIdea.title}
Description: ${projectIdea.description}
Difficulty: ${projectIdea.difficulty}
Technologies: ${projectIdea.technologies.join(', ')}

Generate a complete architecture including:
1. Folder structure (files and folders with proper nesting)
2. Tech stack breakdown (frontend, backend, database, devOps)
3. Implementation tasks (ordered list of tasks to complete the project)
4. Dependencies (npm/pip packages with versions)

Respond ONLY with valid JSON in this exact format:
{
  "folderStructure": {
    "name": "project-root",
    "type": "folder",
    "children": [
      {
        "name": "src",
        "type": "folder",
        "children": [
          {
            "name": "index.ts",
            "type": "file"
          }
        ]
      }
    ]
  },
  "techStack": {
    "frontend": ["React", "TypeScript"],
    "backend": ["Node.js", "Express"],
    "database": ["PostgreSQL"],
    "devOps": ["Docker"]
  },
  "tasks": [
    {
      "id": "1",
      "title": "Setup project structure",
      "description": "Initialize project with necessary folders and configuration files",
      "order": 1
    }
  ],
  "dependencies": [
    {
      "name": "react",
      "version": "^18.0.0",
      "type": "production"
    }
  ]
}`;
  }

  /**
   * Parse and validate the AI-generated architecture response
   */
  private parseArchitectureResponse(content: string): {
    folderStructure: any;
    techStack: any;
    tasks: any[];
    dependencies: any[];
  } {
    try {
      // Try to extract JSON from the response
      let jsonContent = content.trim();

      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent
          .replace(/```json?\n?/g, '')
          .replace(/```$/g, '');
      }

      const parsed = JSON.parse(jsonContent);

      // Validate required fields
      if (
        !parsed.folderStructure ||
        !parsed.techStack ||
        !parsed.tasks ||
        !parsed.dependencies
      ) {
        throw new Error('Invalid architecture structure');
      }

      // Validate folder structure
      if (!parsed.folderStructure.name || !parsed.folderStructure.type) {
        throw new Error('Invalid folder structure');
      }

      // Validate tasks
      if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
        throw new Error('Tasks must be a non-empty array');
      }

      // Validate dependencies
      if (!Array.isArray(parsed.dependencies)) {
        throw new Error('Dependencies must be an array');
      }

      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse architecture response', error);
      throw new Error(
        'Failed to generate a valid architecture. Please try again.',
      );
    }
  }

  /**
   * Get code files for an architecture
   */
  async getCodeFiles(architectureId: string): Promise<CodeFile[]> {
    return this.codeFileRepository.find({
      where: { architectureId },
    });
  }

  /**
   * Generate starter code for a project architecture
   */
  async generateStarterCode(
    architectureId: string,
    userId: string,
  ): Promise<CodeFile[]> {
    this.logger.log(`Generating starter code for architecture ${architectureId}`);

    // Get the architecture with project idea
    const architecture = await this.architectureRepository.findOne({
      where: { id: architectureId },
      relations: ['projectIdea'],
    });

    if (!architecture) {
      throw new NotFoundException('Architecture not found');
    }

    // Verify user owns this project
    if (architecture.projectIdea.userId !== userId) {
      throw new NotFoundException('Architecture not found');
    }

    // Extract files from folder structure
    const filesToGenerate = this.extractFilesFromStructure(
      architecture.folderStructure,
    );

    // Generate code for each file
    const codeFiles: CodeFile[] = [];

    for (const file of filesToGenerate) {
      const code = await this.generateCodeForFile(
        file.path,
        file.language,
        architecture,
      );

      const codeFile = this.codeFileRepository.create({
        architectureId: architecture.id,
        path: file.path,
        content: code,
        language: file.language,
      });

      codeFiles.push(codeFile);
    }

    // Save all code files
    const savedCodeFiles = await this.codeFileRepository.save(codeFiles);

    this.logger.log(
      `Successfully generated ${savedCodeFiles.length} code files`,
    );

    return savedCodeFiles;
  }

  /**
   * Extract files from folder structure
   */
  private extractFilesFromStructure(
    node: any,
    currentPath = '',
  ): Array<{ path: string; language: string }> {
    const files: Array<{ path: string; language: string }> = [];

    if (node.type === 'file') {
      const fullPath = currentPath ? `${currentPath}/${node.name}` : node.name;
      const language = this.getLanguageFromFileName(node.name);
      files.push({ path: fullPath, language });
    } else if (node.type === 'folder' && node.children) {
      const folderPath = currentPath ? `${currentPath}/${node.name}` : node.name;
      for (const child of node.children) {
        files.push(...this.extractFilesFromStructure(child, folderPath));
      }
    }

    return files;
  }

  /**
   * Get programming language from file name
   */
  private getLanguageFromFileName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      java: 'java',
      go: 'go',
      rs: 'rust',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      rb: 'ruby',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      sql: 'sql',
    };

    return languageMap[extension || ''] || 'plaintext';
  }

  /**
   * Generate code for a specific file
   */
  private async generateCodeForFile(
    filePath: string,
    language: string,
    architecture: ProjectArchitecture,
  ): Promise<string> {
    const prompt = this.createCodeGenerationPrompt(
      filePath,
      language,
      architecture,
    );

    try {
      const response = await this.aiService.chat([
        {
          role: 'system',
          content:
            'You are an expert software developer who writes clean, well-documented, production-ready code. Always include comments explaining the code. Respond with ONLY the code, no markdown formatting or explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      // Clean up the response (remove markdown code blocks if present)
      let code = response.content.trim();

      // Remove markdown code blocks
      if (code.startsWith('```')) {
        code = code.replace(/```[a-z]*\n?/g, '').replace(/```$/g, '').trim();
      }

      // Validate that code has comments
      if (!this.hasComments(code, language)) {
        this.logger.warn(
          `Generated code for ${filePath} lacks comments, adding header comment`,
        );
        code = this.addHeaderComment(code, filePath, language);
      }

      return code;
    } catch (error) {
      this.logger.error(`Failed to generate code for ${filePath}`, error);
      // Return a basic template on error
      return this.getBasicTemplate(filePath, language);
    }
  }

  /**
   * Create a prompt for code generation
   */
  private createCodeGenerationPrompt(
    filePath: string,
    language: string,
    architecture: ProjectArchitecture,
  ): string {
    const fileName = filePath.split('/').pop();
    const techStack = Object.values(architecture.techStack).flat().join(', ');

    return `Generate production-ready ${language} code for the file: ${fileName}

File path: ${filePath}
Project: ${architecture.projectIdea.title}
Description: ${architecture.projectIdea.description}
Tech stack: ${techStack}

Requirements:
1. Write clean, well-structured code following ${language} best practices
2. Include comprehensive comments explaining the code
3. Add proper imports and dependencies
4. Include error handling where appropriate
5. Make the code production-ready and maintainable

Generate ONLY the code content, no explanations or markdown formatting.`;
  }

  /**
   * Check if code has comments
   */
  private hasComments(code: string, language: string): boolean {
    const commentPatterns: Record<string, RegExp[]> = {
      typescript: [/\/\//g, /\/\*/g],
      javascript: [/\/\//g, /\/\*/g],
      python: [/#/g, /"""/g, /'''/g],
      java: [/\/\//g, /\/\*/g],
      go: [/\/\//g, /\/\*/g],
      rust: [/\/\//g, /\/\*/g],
      cpp: [/\/\//g, /\/\*/g],
      c: [/\/\//g, /\/\*/g],
      csharp: [/\/\//g, /\/\*/g],
      ruby: [/#/g],
      php: [/\/\//g, /\/\*/g, /#/g],
      html: [/<!--/g],
      css: [/\/\*/g],
      scss: [/\/\//g, /\/\*/g],
    };

    const patterns = commentPatterns[language] || [/\/\//g, /#/g];

    return patterns.some((pattern) => pattern.test(code));
  }

  /**
   * Add a header comment to code
   */
  private addHeaderComment(
    code: string,
    filePath: string,
    language: string,
  ): string {
    const fileName = filePath.split('/').pop();

    const commentStyles: Record<string, { start: string; end: string }> = {
      typescript: { start: '/**\n * ', end: '\n */\n\n' },
      javascript: { start: '/**\n * ', end: '\n */\n\n' },
      python: { start: '"""\n', end: '\n"""\n\n' },
      java: { start: '/**\n * ', end: '\n */\n\n' },
      go: { start: '/*\n * ', end: '\n */\n\n' },
      rust: { start: '//! ', end: '\n\n' },
      html: { start: '<!--\n  ', end: '\n-->\n\n' },
      css: { start: '/*\n * ', end: '\n */\n\n' },
    };

    const style = commentStyles[language] || { start: '// ', end: '\n\n' };

    const comment = `${style.start}${fileName}${style.end}`;

    return comment + code;
  }

  /**
   * Get a basic template for a file
   */
  private getBasicTemplate(filePath: string, language: string): string {
    const fileName = filePath.split('/').pop() || 'file';

    const templates: Record<string, string> = {
      typescript: `// ${fileName}\n\nexport {};\n`,
      javascript: `// ${fileName}\n\nmodule.exports = {};\n`,
      python: `# ${fileName}\n\npass\n`,
      html: `<!DOCTYPE html>\n<html>\n<head>\n  <title>${fileName}</title>\n</head>\n<body>\n  \n</body>\n</html>\n`,
      css: `/* ${fileName} */\n\n`,
      json: `{\n  \n}\n`,
      markdown: `# ${fileName}\n\n`,
    };

    return templates[language] || `// ${fileName}\n\n`;
  }

  /**
   * Export a project to GitHub
   * Creates a new repository and uploads all generated files
   */
  async exportToGitHub(
    architectureId: string,
    userId: string,
    githubToken: string,
    repositoryName?: string,
    description?: string,
    isPrivate = false,
  ): Promise<{ repositoryUrl: string; owner: string; repo: string }> {
    this.logger.log(`Exporting architecture ${architectureId} to GitHub`);

    // Get the architecture with project idea
    const architecture = await this.architectureRepository.findOne({
      where: { id: architectureId },
      relations: ['projectIdea'],
    });

    if (!architecture) {
      throw new NotFoundException('Architecture not found');
    }

    // Verify user owns this project
    if (architecture.projectIdea.userId !== userId) {
      throw new NotFoundException('Architecture not found');
    }

    // Get code files for this architecture
    let codeFiles = await this.getCodeFiles(architectureId);

    // If no code files exist, generate them first
    if (codeFiles.length === 0) {
      this.logger.log('No code files found, generating starter code first');
      codeFiles = await this.generateStarterCode(architectureId, userId);
    }

    // Sanitize and prepare repository name
    const repoName = repositoryName
      ? this.githubService.sanitizeRepositoryName(repositoryName)
      : this.githubService.sanitizeRepositoryName(
          architecture.projectIdea.title,
        );

    // Prepare repository description
    const repoDescription =
      description || architecture.projectIdea.description;

    // Create GitHub repository
    const { owner, repo, url } = await this.githubService.createRepository(
      githubToken,
      repoName,
      repoDescription,
      isPrivate,
    );

    // Generate README.md
    const technologies = Object.values(architecture.techStack).flat();
    const readme = this.githubService.generateReadme(
      architecture.projectIdea.title,
      architecture.projectIdea.description,
      technologies,
      architecture.tasks,
    );

    // Prepare files for upload
    const filesToUpload = [
      {
        path: 'README.md',
        content: readme,
      },
      ...codeFiles.map((file) => ({
        path: file.path,
        content: file.content,
      })),
    ];

    // Upload files to GitHub
    await this.githubService.uploadFiles(
      githubToken,
      owner,
      repo,
      filesToUpload,
    );

    this.logger.log(
      `Successfully exported project to GitHub: ${owner}/${repo}`,
    );

    return {
      repositoryUrl: url,
      owner,
      repo,
    };
  }
}
