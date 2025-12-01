import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume } from '../../entities/resume.entity';
import { ResumeScore } from '../../entities/resume-score.entity';

@Injectable()
export class ResumeScoringService {
  constructor(
    @InjectRepository(ResumeScore)
    private readonly resumeScoreRepository: Repository<ResumeScore>,
  ) {}

  /**
   * Calculate and save resume score
   */
  async scoreResume(resume: Resume): Promise<ResumeScore> {
    const atsCompatibility = this.calculateATSCompatibility(resume);
    const contentQuality = this.calculateContentQuality(resume);
    const overallScore = Math.round((atsCompatibility + contentQuality) / 2);
    const suggestions = this.generateSuggestions(
      resume,
      atsCompatibility,
      contentQuality,
    );

    // Check if score already exists
    let score = await this.resumeScoreRepository.findOne({
      where: { resumeId: resume.id },
    });

    if (score) {
      // Update existing score
      score.overallScore = overallScore;
      score.atsCompatibility = atsCompatibility;
      score.contentQuality = contentQuality;
      score.suggestions = suggestions;
      score.calculatedAt = new Date();
    } else {
      // Create new score
      score = this.resumeScoreRepository.create({
        resumeId: resume.id,
        overallScore,
        atsCompatibility,
        contentQuality,
        suggestions,
        calculatedAt: new Date(),
      });
    }

    return await this.resumeScoreRepository.save(score);
  }

  /**
   * Calculate ATS compatibility score (0-100)
   * Checks for ATS-friendly formatting and structure
   */
  private calculateATSCompatibility(resume: Resume): number {
    let score = 0;
    const { parsedData } = resume;

    // Email present (20 points)
    if (parsedData.email && parsedData.email.length > 0) {
      score += 20;
    }

    // Phone present (10 points)
    if (parsedData.phone) {
      score += 10;
    }

    // Skills section present and populated (25 points)
    if (parsedData.skills && parsedData.skills.length > 0) {
      score += 15;
      // Bonus for having multiple skills
      if (parsedData.skills.length >= 5) {
        score += 10;
      }
    }

    // Experience section present (25 points)
    if (parsedData.experience && parsedData.experience.length > 0) {
      score += 15;
      // Bonus for multiple experiences
      if (parsedData.experience.length >= 2) {
        score += 10;
      }
    }

    // Education section present (20 points)
    if (parsedData.education && parsedData.education.length > 0) {
      score += 15;
      // Bonus for having education details
      if (parsedData.education.length >= 1) {
        score += 5;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate content quality score (0-100)
   * Evaluates the quality and completeness of resume content
   */
  private calculateContentQuality(resume: Resume): number {
    let score = 0;
    const { parsedData } = resume;

    // Name quality (10 points)
    if (parsedData.name && parsedData.name.trim().length > 3) {
      score += 10;
    }

    // Email format (10 points)
    if (parsedData.email && this.isValidEmail(parsedData.email)) {
      score += 10;
    }

    // Skills quality (25 points)
    if (parsedData.skills && parsedData.skills.length > 0) {
      score += 10;
      // More skills = better
      if (parsedData.skills.length >= 5) {
        score += 10;
      }
      if (parsedData.skills.length >= 10) {
        score += 5;
      }
    }

    // Experience quality (30 points)
    if (parsedData.experience && parsedData.experience.length > 0) {
      score += 15;
      // Check for complete experience entries
      const completeExperiences = parsedData.experience.filter(
        (exp) =>
          exp.company &&
          exp.position &&
          exp.startDate &&
          exp.description,
      );
      if (completeExperiences.length > 0) {
        score += 10;
      }
      if (parsedData.experience.length >= 3) {
        score += 5;
      }
    }

    // Education quality (15 points)
    if (parsedData.education && parsedData.education.length > 0) {
      score += 10;
      // Check for complete education entries
      const completeEducation = parsedData.education.filter(
        (edu) =>
          edu.institution &&
          edu.degree &&
          edu.field &&
          edu.graduationDate,
      );
      if (completeEducation.length > 0) {
        score += 5;
      }
    }

    // Summary/objective present (10 points)
    if (parsedData.summary && parsedData.summary.length > 50) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Generate improvement suggestions based on scores
   */
  private generateSuggestions(
    resume: Resume,
    atsScore: number,
    contentScore: number,
  ): string[] {
    const suggestions: string[] = [];
    const { parsedData } = resume;

    // ATS-related suggestions
    if (!parsedData.email) {
      suggestions.push('Add a valid email address to improve ATS compatibility');
    }

    if (!parsedData.phone) {
      suggestions.push('Include a phone number for better contact information');
    }

    if (!parsedData.skills || parsedData.skills.length < 5) {
      suggestions.push(
        'Add more relevant technical skills (aim for at least 5-10 skills)',
      );
    }

    if (!parsedData.experience || parsedData.experience.length === 0) {
      suggestions.push('Include work experience to strengthen your resume');
    } else if (parsedData.experience.length < 2) {
      suggestions.push(
        'Add more work experience entries if available (2-3 is ideal)',
      );
    }

    if (!parsedData.education || parsedData.education.length === 0) {
      suggestions.push('Add your educational background');
    }

    // Content quality suggestions
    if (!parsedData.summary || parsedData.summary.length < 50) {
      suggestions.push(
        'Add a professional summary or objective statement (50-150 words)',
      );
    }

    if (parsedData.experience && parsedData.experience.length > 0) {
      const incompleteExp = parsedData.experience.filter(
        (exp) => !exp.description || exp.description.length < 20,
      );
      if (incompleteExp.length > 0) {
        suggestions.push(
          'Add detailed descriptions to your work experience entries',
        );
      }
    }

    // Overall score suggestions
    if (atsScore < 70) {
      suggestions.push(
        'Improve ATS compatibility by ensuring all standard sections are present',
      );
    }

    if (contentScore < 70) {
      suggestions.push(
        'Enhance content quality by providing more detailed information in each section',
      );
    }

    // Limit to top 5 suggestions
    return suggestions.slice(0, 5);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get score by resume ID
   */
  async getScoreByResumeId(resumeId: string): Promise<ResumeScore | null> {
    return await this.resumeScoreRepository.findOne({
      where: { resumeId },
    });
  }
}
