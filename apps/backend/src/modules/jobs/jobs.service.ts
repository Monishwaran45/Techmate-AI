import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume } from '../../entities/resume.entity';
import { ResumeScore } from '../../entities/resume-score.entity';
import { JobMatch } from '../../entities/job-match.entity';
import { ResumeParserService } from './resume-parser.service';
import { ResumeScoringService } from './resume-scoring.service';
import { ResumeOptimizationService } from './resume-optimization.service';
import { JobMatchingService } from './job-matching.service';
import { JobNotificationService } from './job-notification.service';
import { JobPreferencesDto } from './dto/job-preferences.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Resume)
    private readonly resumeRepository: Repository<Resume>,
    private readonly resumeParserService: ResumeParserService,
    private readonly resumeScoringService: ResumeScoringService,
    private readonly resumeOptimizationService: ResumeOptimizationService,
    private readonly jobMatchingService: JobMatchingService,
    private readonly jobNotificationService: JobNotificationService,
  ) {}

  /**
   * Upload and parse a resume
   */
  async uploadResume(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Resume> {
    // Validate file type
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are supported');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    // Parse the resume
    const parsedData = await this.resumeParserService.parseResume(
      file.buffer,
      file.originalname,
    );

    // Validate that required fields were extracted
    if (!parsedData.email) {
      throw new BadRequestException(
        'Could not extract email from resume. Please ensure your resume contains a valid email address.',
      );
    }

    // Create resume entity
    const resume = this.resumeRepository.create({
      userId,
      fileName: file.originalname,
      fileUrl: `/uploads/resumes/${userId}/${file.originalname}`, // Placeholder URL
      parsedData,
      uploadedAt: new Date(),
    });

    // Save to database
    return await this.resumeRepository.save(resume);
  }

  /**
   * Get resume by ID
   */
  async getResumeById(id: string): Promise<Resume> {
    const resume = await this.resumeRepository.findOne({
      where: { id },
      relations: ['score'],
    });

    if (!resume) {
      throw new BadRequestException('Resume not found');
    }

    return resume;
  }

  /**
   * Get all resumes for a user
   */
  async getUserResumes(userId: string): Promise<Resume[]> {
    return await this.resumeRepository.find({
      where: { userId },
      relations: ['score'],
      order: { uploadedAt: 'DESC' },
    });
  }

  /**
   * Score a resume
   */
  async scoreResume(resumeId: string): Promise<ResumeScore> {
    const resume = await this.getResumeById(resumeId);
    return await this.resumeScoringService.scoreResume(resume);
  }

  /**
   * Get resume score
   */
  async getResumeScore(resumeId: string): Promise<ResumeScore> {
    const resume = await this.getResumeById(resumeId);

    if (!resume.score) {
      // Score doesn't exist, calculate it
      return await this.scoreResume(resumeId);
    }

    return resume.score;
  }

  /**
   * Optimize resume for ATS compatibility
   */
  async optimizeResume(resumeId: string): Promise<Resume> {
    return await this.resumeOptimizationService.optimizeResume(resumeId);
  }

  /**
   * Match jobs based on user preferences
   */
  async matchJobs(
    userId: string,
    preferences: JobPreferencesDto,
  ): Promise<JobMatch[]> {
    const matches = await this.jobMatchingService.matchJobs(userId, preferences);
    
    // Schedule notifications for new job matches
    if (matches.length > 0) {
      const jobMatchIds = matches.map(m => m.id);
      await this.jobNotificationService.scheduleMultipleNotifications(
        userId,
        jobMatchIds,
      );
    }
    
    return matches;
  }

  /**
   * Get user's job matches
   */
  async getUserJobMatches(userId: string): Promise<JobMatch[]> {
    return await this.jobMatchingService.getUserMatches(userId);
  }
}
