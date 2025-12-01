import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { Roadmap } from '../../entities/roadmap.entity';
import { Milestone } from '../../entities/milestone.entity';
import { Progress } from '../../entities/progress.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { AIService } from '../ai/ai.service';
import { GenerateRoadmapDto, SkillLevel } from './dto/generate-roadmap.dto';
import { ExplainConceptDto } from './dto/explain-concept.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { GetTechNewsDto, NewsItem } from './dto/get-tech-news.dto';
import { WeeklyReminderJob } from './jobs/weekly-reminder.processor';

interface ParsedMilestone {
  title: string;
  description: string;
  topics: string[];
  resources: Array<{
    title: string;
    url: string;
    type: 'article' | 'video' | 'course' | 'documentation';
  }>;
  order: number;
}

@Injectable()
export class LearningService {
  private readonly logger = new Logger(LearningService.name);

  constructor(
    @InjectRepository(Roadmap)
    private readonly roadmapRepository: Repository<Roadmap>,
    @InjectRepository(Milestone)
    private readonly milestoneRepository: Repository<Milestone>,
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    private readonly aiService: AIService,
    @InjectQueue('learning-reminders')
    private readonly reminderQueue: Queue<WeeklyReminderJob>,
  ) {}

  /**
   * Generate a personalized learning roadmap based on goals, skills, and experience level
   */
  async generateRoadmap(
    userId: string,
    dto: GenerateRoadmapDto,
  ): Promise<Roadmap> {
    // Fetch user's profile to get skills and goals
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    const userSkills = profile?.skills || [];
    const userGoals = profile?.goals || [];
    const experience = profile?.experience || dto.skillLevel;

    // Combine DTO goals with profile goals (prioritize DTO goals)
    const combinedGoals = dto.goals.length > 0 ? dto.goals : userGoals;

    this.logger.log(
      `Generating roadmap for user ${userId} with skills: ${userSkills.join(', ')}, goals: ${combinedGoals.join(', ')}`,
    );

    // Create prompt for roadmap generation with skills context
    const prompt = this.createRoadmapPrompt(combinedGoals, dto.skillLevel, userSkills, experience);

    // Call AI service to generate roadmap
    const response = await this.aiService.chat([
      {
        role: 'system',
        content:
          'You are an expert technical mentor who creates structured learning roadmaps. Always respond with valid JSON only, no additional text.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // Parse and validate the AI response
    const parsedRoadmap = this.parseRoadmapResponse(response.content);

    // Create roadmap entity
    const roadmap = this.roadmapRepository.create({
      userId,
      title: parsedRoadmap.title,
      description: parsedRoadmap.description,
      active: true,
    });

    // Save roadmap
    const savedRoadmap = await this.roadmapRepository.save(roadmap);

    // Create milestones
    const milestones = parsedRoadmap.milestones.map((m: ParsedMilestone) =>
      this.milestoneRepository.create({
        roadmapId: savedRoadmap.id,
        title: m.title,
        description: m.description,
        topics: m.topics,
        resources: m.resources,
        order: m.order,
        completed: false,
      }),
    );

    // Save milestones
    await this.milestoneRepository.save(milestones);

    // Reload roadmap with milestones
    const completeRoadmap = await this.roadmapRepository.findOne({
      where: { id: savedRoadmap.id },
      relations: ['milestones'],
    });

    // Schedule weekly reminders for the new roadmap
    await this.scheduleWeeklyReminder(userId, savedRoadmap.id);

    this.logger.log(
      `Successfully generated roadmap ${completeRoadmap.id} with ${milestones.length} milestones`,
    );

    return completeRoadmap;
  }

  /**
   * Create a prompt for roadmap generation
   */
  private createRoadmapPrompt(
    goals: string[], 
    skillLevel: SkillLevel, 
    existingSkills: string[] = [],
    experience?: string
  ): string {
    const skillsContext = existingSkills.length > 0 
      ? `\n\nThe learner already has experience with: ${existingSkills.join(', ')}.
Build upon these existing skills and avoid covering basics they already know.`
      : '';

    const experienceContext = experience && experience !== skillLevel
      ? `\nTheir self-reported experience level is: ${experience}.`
      : '';

    return `Create a comprehensive learning roadmap for someone with ${skillLevel} skill level who wants to achieve the following goals:
${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}${skillsContext}${experienceContext}

Generate a structured roadmap with 4-8 milestones that:
- Build progressively from their current skill level
- Leverage their existing knowledge where applicable
- Focus on practical, hands-on learning
- Include real-world project ideas

Each milestone should include:
- A clear title
- A detailed description
- 3-5 specific topics to learn
- 2-4 learning resources (articles, videos, courses, or documentation)

Respond ONLY with valid JSON in this exact format:
{
  "title": "Learning Roadmap Title",
  "description": "Brief overview of the learning path",
  "milestones": [
    {
      "title": "Milestone Title",
      "description": "What you'll learn in this milestone",
      "topics": ["Topic 1", "Topic 2", "Topic 3"],
      "resources": [
        {
          "title": "Resource Title",
          "url": "https://example.com",
          "type": "article"
        }
      ],
      "order": 1
    }
  ]
}`;
  }

  /**
   * Parse and validate the AI-generated roadmap response
   */
  private parseRoadmapResponse(content: string): {
    title: string;
    description: string;
    milestones: ParsedMilestone[];
  } {
    try {
      // Try to extract JSON from the response
      let jsonContent = content.trim();

      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```json?\n?/g, '').replace(/```$/g, '');
      }

      const parsed = JSON.parse(jsonContent);

      // Validate required fields
      if (!parsed.title || !parsed.milestones || !Array.isArray(parsed.milestones)) {
        throw new Error('Invalid roadmap structure');
      }

      // Validate each milestone
      parsed.milestones.forEach((milestone: any, index: number) => {
        if (!milestone.title || !milestone.description || !milestone.topics) {
          throw new Error(`Invalid milestone at index ${index}`);
        }
        if (!Array.isArray(milestone.topics)) {
          throw new Error(`Milestone topics must be an array at index ${index}`);
        }
        if (!milestone.resources) {
          milestone.resources = [];
        }
        if (!milestone.order) {
          milestone.order = index + 1;
        }
      });

      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse roadmap response', error);
      throw new Error('Failed to generate a valid roadmap. Please try again.');
    }
  }

  /**
   * Explain a concept with optional context from user's roadmap
   */
  async explainConcept(
    userId: string,
    dto: ExplainConceptDto,
  ): Promise<string> {
    this.logger.log(`Explaining concept "${dto.concept}" for user ${userId}`);

    // Build context from user's active roadmap if available
    let contextInfo = '';
    if (dto.context) {
      contextInfo = `\n\nContext: ${dto.context}`;
    } else {
      // Try to get context from user's active roadmap
      const activeRoadmap = await this.roadmapRepository.findOne({
        where: { userId, active: true },
        relations: ['milestones'],
      });

      if (activeRoadmap) {
        const topics = activeRoadmap.milestones
          .flatMap((m) => m.topics)
          .slice(0, 10);
        contextInfo = `\n\nThe user is currently learning: ${topics.join(', ')}`;
      }
    }

    const prompt = `Explain the following technical concept in a clear and concise way: ${dto.concept}${contextInfo}

Provide:
1. A simple definition
2. Why it's important
3. A practical example
4. Common use cases

Keep the explanation accessible but technically accurate.`;

    const response = await this.aiService.chat([
      {
        role: 'system',
        content:
          'You are a helpful technical mentor who explains concepts clearly and concisely.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return response.content;
  }

  /**
   * Update progress for a milestone
   */
  async updateProgress(
    userId: string,
    milestoneId: string,
    dto: UpdateProgressDto,
  ): Promise<Progress> {
    this.logger.log(
      `Updating progress for milestone ${milestoneId}, user ${userId}`,
    );

    // Verify milestone exists
    const milestone = await this.milestoneRepository.findOne({
      where: { id: milestoneId },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    // Find or create progress record
    let progress = await this.progressRepository.findOne({
      where: { userId, milestoneId },
    });

    if (!progress) {
      progress = this.progressRepository.create({
        userId,
        milestoneId,
        status: 'not_started',
        lastAccessedAt: new Date(),
      });
    }

    // Update progress
    if (dto.status) {
      progress.status = dto.status;
    }
    progress.lastAccessedAt = new Date();

    // Update milestone completion status
    if (dto.status === 'completed') {
      milestone.completed = true;
      milestone.completedAt = new Date();
      await this.milestoneRepository.save(milestone);
    }

    return this.progressRepository.save(progress);
  }

  /**
   * Get progress statistics for a user
   */
  async getProgressStats(userId: string): Promise<{
    totalMilestones: number;
    completedMilestones: number;
    inProgressMilestones: number;
    completionPercentage: number;
  }> {
    const roadmaps = await this.roadmapRepository.find({
      where: { userId, active: true },
      relations: ['milestones'],
    });

    const totalMilestones = roadmaps.reduce(
      (sum, r) => sum + r.milestones.length,
      0,
    );
    const completedMilestones = roadmaps.reduce(
      (sum, r) => sum + r.milestones.filter((m) => m.completed).length,
      0,
    );

    const allProgress = await this.progressRepository.find({
      where: { userId },
    });
    const inProgressMilestones = allProgress.filter(
      (p) => p.status === 'in_progress',
    ).length;

    const completionPercentage =
      totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    return {
      totalMilestones,
      completedMilestones,
      inProgressMilestones,
      completionPercentage: Math.round(completionPercentage),
    };
  }

  /**
   * Get user's active roadmap
   */
  async getActiveRoadmap(userId: string): Promise<Roadmap | null> {
    return this.roadmapRepository.findOne({
      where: { userId, active: true },
      relations: ['milestones'],
    });
  }

  /**
   * Schedule weekly reminders for a roadmap
   */
  async scheduleWeeklyReminder(
    userId: string,
    roadmapId: string,
  ): Promise<void> {
    this.logger.log(
      `Scheduling weekly reminder for user ${userId}, roadmap ${roadmapId}`,
    );

    // Schedule a repeating job that runs every Monday at 9 AM
    await this.reminderQueue.add(
      'weekly-reminder',
      { userId, roadmapId },
      {
        repeat: {
          cron: '0 9 * * 1', // Every Monday at 9 AM
        },
        jobId: `weekly-reminder-${userId}-${roadmapId}`,
      },
    );

    this.logger.log(
      `Weekly reminder scheduled for user ${userId}, roadmap ${roadmapId}`,
    );
  }

  /**
   * Cancel weekly reminders for a roadmap
   */
  async cancelWeeklyReminder(
    userId: string,
    roadmapId: string,
  ): Promise<void> {
    const jobId = `weekly-reminder-${userId}-${roadmapId}`;
    const job = await this.reminderQueue.getJob(jobId);

    if (job) {
      await job.remove();
      this.logger.log(`Cancelled weekly reminder for ${jobId}`);
    }
  }

  /**
   * Send weekly reminders to all users with active roadmaps
   */
  async sendWeeklyReminders(): Promise<void> {
    this.logger.log('Sending weekly reminders to all active roadmap users');

    const activeRoadmaps = await this.roadmapRepository.find({
      where: { active: true },
      relations: ['user'],
    });

    for (const roadmap of activeRoadmaps) {
      await this.reminderQueue.add('weekly-reminder', {
        userId: roadmap.userId,
        roadmapId: roadmap.id,
      });
    }

    this.logger.log(
      `Queued ${activeRoadmaps.length} weekly reminder notifications`,
    );
  }

  /**
   * Get and summarize tech news
   * Note: In a production environment, this would integrate with a real news API
   * For now, we'll generate summaries using AI based on common tech topics
   */
  async getTechNews(dto: GetTechNewsDto): Promise<NewsItem[]> {
    this.logger.log(
      `Fetching tech news${dto.topics ? ` for topics: ${dto.topics.join(', ')}` : ''}`,
    );

    // In a real implementation, this would call a news API like NewsAPI
    // For now, we'll generate mock news items and summarize them with AI

    const topics = dto.topics || [
      'JavaScript',
      'TypeScript',
      'React',
      'Node.js',
      'AI',
    ];

    // Generate news summaries using AI
    const prompt = `Generate 3-5 recent tech news summaries about the following topics: ${topics.join(', ')}.

For each news item, provide:
- A compelling title
- A brief 2-3 sentence summary
- A realistic source name (e.g., TechCrunch, The Verge, Hacker News)

Format your response as a JSON array with this structure:
[
  {
    "title": "News Title",
    "summary": "Brief summary of the news",
    "source": "Source Name"
  }
]

Focus on recent developments, new releases, and important updates in the tech industry.`;

    try {
      const response = await this.aiService.chat([
        {
          role: 'system',
          content:
            'You are a tech news curator who provides concise, accurate summaries of recent technology news. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      // Parse the AI response
      const newsItems = this.parseTechNewsResponse(response.content);

      this.logger.log(`Retrieved ${newsItems.length} tech news items`);

      return newsItems;
    } catch (error) {
      this.logger.error('Failed to fetch tech news', error);
      // Return empty array on error rather than throwing
      return [];
    }
  }

  /**
   * Parse tech news response from AI
   */
  private parseTechNewsResponse(content: string): NewsItem[] {
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

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      // Transform to NewsItem format
      return parsed.map((item: any) => ({
        title: item.title || 'Untitled',
        summary: item.summary || '',
        url: item.url || '#', // In real implementation, this would come from the news API
        publishedAt: new Date(), // In real implementation, this would come from the news API
        source: item.source || 'Unknown',
      }));
    } catch (error) {
      this.logger.error('Failed to parse tech news response', error);
      return [];
    }
  }
}
