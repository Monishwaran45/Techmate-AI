import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobMatch } from '../../entities/job-match.entity';
import { Resume } from '../../entities/resume.entity';
import { JobPreferencesDto } from './dto/job-preferences.dto';

// Mock job data structure
interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  location: string;
  experienceLevel: string;
  salaryRange?: string;
  url?: string;
}

@Injectable()
export class JobMatchingService {
  constructor(
    @InjectRepository(JobMatch)
    private readonly jobMatchRepository: Repository<JobMatch>,
    @InjectRepository(Resume)
    private readonly resumeRepository: Repository<Resume>,
  ) {}

  /**
   * Match jobs based on user preferences and resume
   */
  async matchJobs(
    userId: string,
    preferences: JobPreferencesDto,
  ): Promise<JobMatch[]> {
    // Get user's resume for additional context
    const resumes = await this.resumeRepository.find({
      where: { userId },
      order: { uploadedAt: 'DESC' },
      take: 1,
    });

    const userSkills =
      resumes.length > 0 ? resumes[0].parsedData.skills : preferences.skills;

    // In a real implementation, this would fetch from a job API
    // For now, we'll use mock data
    const availableJobs = this.getMockJobs();

    // Calculate match scores for each job
    const matches = availableJobs.map((job) => {
      const matchScore = this.calculateMatchScore(
        job,
        preferences,
        userSkills,
      );
      const matchReasons = this.generateMatchReasons(
        job,
        preferences,
        userSkills,
        matchScore,
      );

      return {
        job,
        matchScore,
        matchReasons,
      };
    });

    // Filter jobs with score >= 50 and sort by score
    const qualifiedMatches = matches
      .filter((m) => m.matchScore >= 50)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Top 10 matches

    // Save matches to database
    const savedMatches: JobMatch[] = [];
    
    for (const match of qualifiedMatches) {
      const jobMatch = this.jobMatchRepository.create({
        userId,
        jobTitle: match.job.title,
        company: match.job.company,
        matchScore: match.matchScore,
        matchReasons: match.matchReasons,
        jobUrl: match.job.url,
        description: match.job.description,
        requiredSkills: match.job.requiredSkills,
        location: match.job.location,
        salaryRange: match.job.salaryRange,
        notified: false,
      });

      const saved = await this.jobMatchRepository.save(jobMatch);
      savedMatches.push(saved);
    }

    return savedMatches;
  }

  /**
   * Calculate match score between job and user preferences
   */
  private calculateMatchScore(
    job: Job,
    preferences: JobPreferencesDto,
    userSkills: string[],
  ): number {
    let score = 0;

    // Skill matching (50 points max)
    const skillMatchScore = this.calculateSkillMatch(
      job.requiredSkills,
      userSkills,
    );
    score += skillMatchScore * 50;

    // Job title matching (25 points max)
    const titleMatchScore = this.calculateTitleMatch(
      job.title,
      preferences.jobTitles,
    );
    score += titleMatchScore * 25;

    // Location matching (15 points max)
    if (preferences.locations && preferences.locations.length > 0) {
      const locationMatch = preferences.locations.some(
        (loc) =>
          job.location.toLowerCase().includes(loc.toLowerCase()) ||
          loc.toLowerCase().includes(job.location.toLowerCase()),
      );
      if (locationMatch) {
        score += 15;
      }
    } else {
      // No location preference, give partial points
      score += 10;
    }

    // Experience level matching (10 points max)
    if (preferences.experienceLevel) {
      if (
        job.experienceLevel.toLowerCase() ===
        preferences.experienceLevel.toLowerCase()
      ) {
        score += 10;
      } else {
        // Partial match for adjacent levels
        score += 5;
      }
    } else {
      score += 5;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate skill match percentage
   */
  private calculateSkillMatch(
    requiredSkills: string[],
    userSkills: string[],
  ): number {
    if (requiredSkills.length === 0) return 1;

    const normalizedUserSkills = userSkills.map((s) => s.toLowerCase());
    const matchedSkills = requiredSkills.filter((skill) =>
      normalizedUserSkills.some((userSkill) =>
        userSkill.includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill)
      ),
    );

    return matchedSkills.length / requiredSkills.length;
  }

  /**
   * Calculate title match score
   */
  private calculateTitleMatch(
    jobTitle: string,
    preferredTitles: string[],
  ): number {
    if (preferredTitles.length === 0) return 0.5;

    const normalizedJobTitle = jobTitle.toLowerCase();
    const hasMatch = preferredTitles.some((title) =>
      normalizedJobTitle.includes(title.toLowerCase()) ||
      title.toLowerCase().includes(normalizedJobTitle)
    );

    return hasMatch ? 1 : 0.3;
  }

  /**
   * Generate match reasons
   */
  private generateMatchReasons(
    job: Job,
    preferences: JobPreferencesDto,
    userSkills: string[],
    matchScore: number,
  ): string[] {
    const reasons: string[] = [];

    // Skill matches
    const normalizedUserSkills = userSkills.map((s) => s.toLowerCase());
    const matchedSkills = job.requiredSkills.filter((skill) =>
      normalizedUserSkills.some((userSkill) =>
        userSkill.includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill)
      ),
    );

    if (matchedSkills.length > 0) {
      reasons.push(
        `${matchedSkills.length} matching skills: ${matchedSkills.slice(0, 3).join(', ')}`,
      );
    }

    // Title match
    const titleMatch = preferences.jobTitles.some((title) =>
      job.title.toLowerCase().includes(title.toLowerCase()),
    );
    if (titleMatch) {
      reasons.push('Job title matches your preferences');
    }

    // Location match
    if (preferences.locations && preferences.locations.length > 0) {
      const locationMatch = preferences.locations.some((loc) =>
        job.location.toLowerCase().includes(loc.toLowerCase()),
      );
      if (locationMatch) {
        reasons.push('Location matches your preference');
      }
    }

    // Experience level
    if (
      preferences.experienceLevel &&
      job.experienceLevel.toLowerCase() ===
        preferences.experienceLevel.toLowerCase()
    ) {
      reasons.push('Experience level matches your profile');
    }

    // Overall score
    if (matchScore >= 80) {
      reasons.push('Strong overall match');
    } else if (matchScore >= 70) {
      reasons.push('Good overall match');
    }

    return reasons;
  }

  /**
   * Get user's job matches
   */
  async getUserMatches(userId: string): Promise<JobMatch[]> {
    return await this.jobMatchRepository.find({
      where: { userId },
      order: { matchScore: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Mock job data (in real implementation, this would fetch from external API)
   */
  private getMockJobs(): Job[] {
    return [
      {
        id: '1',
        title: 'Senior Full Stack Developer',
        company: 'Tech Corp',
        description: 'Build scalable web applications',
        requiredSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
        location: 'San Francisco, CA',
        experienceLevel: 'Senior',
        salaryRange: '$120k - $180k',
        url: 'https://example.com/job/1',
      },
      {
        id: '2',
        title: 'Frontend Engineer',
        company: 'StartupXYZ',
        description: 'Create beautiful user interfaces',
        requiredSkills: ['React', 'TypeScript', 'CSS', 'HTML'],
        location: 'Remote',
        experienceLevel: 'Mid-level',
        salaryRange: '$90k - $130k',
        url: 'https://example.com/job/2',
      },
      {
        id: '3',
        title: 'Backend Developer',
        company: 'Enterprise Solutions',
        description: 'Design and implement APIs',
        requiredSkills: ['Node.js', 'PostgreSQL', 'Docker', 'AWS'],
        location: 'New York, NY',
        experienceLevel: 'Mid-level',
        salaryRange: '$100k - $140k',
        url: 'https://example.com/job/3',
      },
      {
        id: '4',
        title: 'DevOps Engineer',
        company: 'Cloud Services Inc',
        description: 'Manage infrastructure and deployments',
        requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
        location: 'Austin, TX',
        experienceLevel: 'Senior',
        salaryRange: '$110k - $160k',
        url: 'https://example.com/job/4',
      },
      {
        id: '5',
        title: 'Software Engineer',
        company: 'Innovation Labs',
        description: 'Work on cutting-edge projects',
        requiredSkills: ['Python', 'JavaScript', 'React', 'MongoDB'],
        location: 'Seattle, WA',
        experienceLevel: 'Junior',
        salaryRange: '$70k - $100k',
        url: 'https://example.com/job/5',
      },
    ];
  }
}
