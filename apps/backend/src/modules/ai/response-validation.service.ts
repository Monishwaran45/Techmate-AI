import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIFeedback } from '../../entities/ai-feedback.entity';

export interface ValidationResult {
  isValid: boolean;
  sanitizedResponse: string;
  hasComments: boolean;
  issues: string[];
}

export interface FeedbackDto {
  userId: string;
  prompt: string;
  response: string;
  rating: 'positive' | 'negative' | 'neutral';
  comment?: string;
  metadata?: Record<string, any>;
}

/**
 * AI Response Validation Service
 * Handles response sanitization, comment detection, and feedback storage
 */
@Injectable()
export class ResponseValidationService {
  private readonly logger = new Logger(ResponseValidationService.name);

  constructor(
    @InjectRepository(AIFeedback)
    private feedbackRepository: Repository<AIFeedback>,
  ) {
    this.logger.log('Response Validation Service initialized');
  }

  /**
   * Validate and sanitize an AI response
   */
  validateResponse(response: string, isCodeResponse: boolean = false): ValidationResult {
    const issues: string[] = [];
    let sanitizedResponse = response;

    // Check if response is empty
    if (!response || response.trim().length === 0) {
      issues.push('Response is empty');
      return {
        isValid: false,
        sanitizedResponse: '',
        hasComments: false,
        issues,
      };
    }

    // Sanitize response (remove potential harmful content)
    sanitizedResponse = this.sanitizeResponse(sanitizedResponse);

    // Check for comments in code responses
    const hasComments = isCodeResponse ? this.detectComments(sanitizedResponse) : false;

    // Validate response length (not too short, not too long)
    if (sanitizedResponse.length < 10) {
      issues.push('Response is too short');
    }

    if (sanitizedResponse.length > 50000) {
      issues.push('Response is too long');
      sanitizedResponse = sanitizedResponse.substring(0, 50000) + '... [truncated]';
    }

    return {
      isValid: issues.length === 0,
      sanitizedResponse,
      hasComments,
      issues,
    };
  }

  /**
   * Sanitize response by removing potentially harmful content
   */
  private sanitizeResponse(response: string): string {
    let sanitized = response;

    // Remove potential script tags (basic XSS prevention)
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove potential iframe tags
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    // Trim excessive whitespace
    sanitized = sanitized.trim();

    return sanitized;
  }

  /**
   * Detect if code contains comments
   */
  detectComments(code: string): boolean {
    // Check for common comment patterns
    const commentPatterns = [
      /\/\/.+/g, // Single-line comments (// ...)
      /\/\*[\s\S]*?\*\//g, // Multi-line comments (/* ... */)
      /#.+/g, // Python/Shell comments (# ...)
      /<!--[\s\S]*?-->/g, // HTML comments (<!-- ... -->)
      /""".+"""/gs, // Python docstrings (""" ... """)
      /'''.+'''/gs, // Python docstrings (''' ... ''')
    ];

    for (const pattern of commentPatterns) {
      if (pattern.test(code)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Store user feedback on AI response
   */
  async storeFeedback(feedbackDto: FeedbackDto): Promise<AIFeedback> {
    try {
      this.logger.debug(`Storing feedback for user ${feedbackDto.userId}`);

      const feedback = this.feedbackRepository.create({
        userId: feedbackDto.userId,
        prompt: feedbackDto.prompt,
        response: feedbackDto.response,
        rating: feedbackDto.rating,
        comment: feedbackDto.comment,
        metadata: feedbackDto.metadata,
      });

      const saved = await this.feedbackRepository.save(feedback);

      this.logger.log(`Feedback stored with ID: ${saved.id}`);
      return saved;
    } catch (error: any) {
      this.logger.error(
        `Failed to store feedback: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new Error('Failed to store feedback. Please try again.');
    }
  }

  /**
   * Get feedback for a user
   */
  async getUserFeedback(
    userId: string,
    limit: number = 50,
  ): Promise<AIFeedback[]> {
    try {
      return await this.feedbackRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to get user feedback: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new Error('Failed to retrieve feedback. Please try again.');
    }
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(userId?: string): Promise<{
    total: number;
    positive: number;
    negative: number;
    neutral: number;
  }> {
    try {
      const query = this.feedbackRepository.createQueryBuilder('feedback');

      if (userId) {
        query.where('feedback.user_id = :userId', { userId });
      }

      const [total, positive, negative, neutral] = await Promise.all([
        query.getCount(),
        query.clone().andWhere('feedback.rating = :rating', { rating: 'positive' }).getCount(),
        query.clone().andWhere('feedback.rating = :rating', { rating: 'negative' }).getCount(),
        query.clone().andWhere('feedback.rating = :rating', { rating: 'neutral' }).getCount(),
      ]);

      return { total, positive, negative, neutral };
    } catch (error: any) {
      this.logger.error(
        `Failed to get feedback stats: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new Error('Failed to retrieve feedback statistics. Please try again.');
    }
  }
}
