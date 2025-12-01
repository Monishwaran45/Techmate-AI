import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume } from '../../entities/resume.entity';
import { AIService } from '../ai/ai.service';
import { ResumeScoringService } from './resume-scoring.service';

@Injectable()
export class ResumeOptimizationService {
  constructor(
    @InjectRepository(Resume)
    private readonly resumeRepository: Repository<Resume>,
    private readonly aiService: AIService,
    private readonly scoringService: ResumeScoringService,
  ) {}

  /**
   * Optimize resume for ATS compatibility
   */
  async optimizeResume(resumeId: string): Promise<Resume> {
    // Get the original resume
    const originalResume = await this.resumeRepository.findOne({
      where: { id: resumeId },
      relations: ['score'],
    });

    if (!originalResume) {
      throw new Error('Resume not found');
    }

    // Get the current score to understand weaknesses
    let currentScore = originalResume.score;
    if (!currentScore) {
      currentScore = await this.scoringService.scoreResume(originalResume);
    }

    // Generate optimization prompt
    const prompt = this.buildOptimizationPrompt(
      originalResume,
      currentScore.suggestions,
    );

    // Get AI suggestions for optimization
    const aiResponse = await this.aiService.chat([
      {
        role: 'system',
        content:
          'You are an expert resume writer and ATS optimization specialist. Your goal is to improve resumes for better ATS compatibility while maintaining accuracy and professionalism.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // Parse AI response and create optimized resume data
    const optimizedData = this.parseOptimizationResponse(
      aiResponse.content,
      originalResume.parsedData,
    );

    // Create new optimized resume
    const optimizedResume = this.resumeRepository.create({
      userId: originalResume.userId,
      fileName: `optimized_${originalResume.fileName}`,
      fileUrl: `/uploads/resumes/${originalResume.userId}/optimized_${originalResume.fileName}`,
      parsedData: optimizedData,
      uploadedAt: new Date(),
    });

    // Save optimized resume
    const savedResume = await this.resumeRepository.save(optimizedResume);

    // Score the optimized resume
    await this.scoringService.scoreResume(savedResume);

    return savedResume;
  }

  /**
   * Build optimization prompt for AI
   */
  private buildOptimizationPrompt(
    resume: Resume,
    suggestions: string[],
  ): string {
    const { parsedData } = resume;

    let prompt = `Please optimize the following resume for ATS (Applicant Tracking System) compatibility.\n\n`;
    prompt += `Current Resume Data:\n`;
    prompt += `Name: ${parsedData.name}\n`;
    prompt += `Email: ${parsedData.email}\n`;
    if (parsedData.phone) {
      prompt += `Phone: ${parsedData.phone}\n`;
    }
    prompt += `\n`;

    if (parsedData.summary) {
      prompt += `Summary:\n${parsedData.summary}\n\n`;
    }

    if (parsedData.skills && parsedData.skills.length > 0) {
      prompt += `Skills:\n${parsedData.skills.join(', ')}\n\n`;
    }

    if (parsedData.experience && parsedData.experience.length > 0) {
      prompt += `Experience:\n`;
      parsedData.experience.forEach((exp, index) => {
        prompt += `${index + 1}. ${exp.position} at ${exp.company}\n`;
        prompt += `   ${exp.startDate} - ${exp.endDate || 'Present'}\n`;
        prompt += `   ${exp.description}\n\n`;
      });
    }

    if (parsedData.education && parsedData.education.length > 0) {
      prompt += `Education:\n`;
      parsedData.education.forEach((edu, index) => {
        prompt += `${index + 1}. ${edu.degree} in ${edu.field}\n`;
        prompt += `   ${edu.institution}, ${edu.graduationDate}\n\n`;
      });
    }

    prompt += `\nImprovement Suggestions:\n`;
    suggestions.forEach((suggestion, index) => {
      prompt += `${index + 1}. ${suggestion}\n`;
    });

    prompt += `\nPlease provide an optimized version with:\n`;
    prompt += `1. Enhanced professional summary (if missing or weak)\n`;
    prompt += `2. Additional relevant skills (if needed)\n`;
    prompt += `3. Improved experience descriptions with action verbs and quantifiable achievements\n`;
    prompt += `4. Better formatting and structure for ATS parsing\n`;
    prompt += `5. Keywords relevant to the candidate's field\n\n`;
    prompt += `Return the optimized data in JSON format with the same structure as the input.`;

    return prompt;
  }

  /**
   * Parse AI optimization response
   */
  private parseOptimizationResponse(
    aiResponse: string,
    originalData: Resume['parsedData'],
  ): Resume['parsedData'] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Merge with original data, preferring optimized values
        return {
          name: parsed.name || originalData.name,
          email: parsed.email || originalData.email,
          phone: parsed.phone || originalData.phone,
          skills: parsed.skills && parsed.skills.length > 0 
            ? parsed.skills 
            : originalData.skills,
          experience: parsed.experience && parsed.experience.length > 0
            ? parsed.experience
            : originalData.experience,
          education: parsed.education && parsed.education.length > 0
            ? parsed.education
            : originalData.education,
          summary: parsed.summary || originalData.summary,
        };
      }
    } catch (error) {
      // If parsing fails, apply basic optimizations
      console.error('Failed to parse AI response, applying basic optimizations:', error);
    }

    // Fallback: Apply basic optimizations
    return this.applyBasicOptimizations(originalData);
  }

  /**
   * Apply basic optimizations without AI
   */
  private applyBasicOptimizations(
    data: Resume['parsedData'],
  ): Resume['parsedData'] {
    const optimized = { ...data };

    // Enhance summary if missing
    if (!optimized.summary || optimized.summary.length < 50) {
      optimized.summary = this.generateBasicSummary(data);
    }

    // Add common skills if list is short
    if (optimized.skills.length < 5) {
      optimized.skills = [...optimized.skills, ...this.suggestCommonSkills(data)];
    }

    // Enhance experience descriptions
    if (optimized.experience && optimized.experience.length > 0) {
      optimized.experience = optimized.experience.map((exp) => ({
        ...exp,
        description: this.enhanceDescription(exp.description),
      }));
    }

    return optimized;
  }

  /**
   * Generate a basic professional summary
   */
  private generateBasicSummary(data: Resume['parsedData']): string {
    const skills = data.skills.slice(0, 3).join(', ');
    const yearsExp = data.experience?.length || 0;
    
    return `Professional with ${yearsExp}+ years of experience in technology. Skilled in ${skills}. Proven track record of delivering high-quality solutions and collaborating effectively with cross-functional teams.`;
  }

  /**
   * Suggest common skills based on existing skills
   */
  private suggestCommonSkills(data: Resume['parsedData']): string[] {
    const suggestions: string[] = [];
    const currentSkills = data.skills.map((s) => s.toLowerCase());

    // Suggest complementary skills
    if (currentSkills.some((s) => s.includes('javascript') || s.includes('typescript'))) {
      if (!currentSkills.includes('git')) suggestions.push('Git');
      if (!currentSkills.includes('rest')) suggestions.push('REST APIs');
    }

    if (currentSkills.some((s) => s.includes('react') || s.includes('vue') || s.includes('angular'))) {
      if (!currentSkills.includes('html')) suggestions.push('HTML');
      if (!currentSkills.includes('css')) suggestions.push('CSS');
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Enhance experience description with action verbs
   */
  private enhanceDescription(description: string): string {
    if (!description || description.length < 20) {
      return 'Contributed to team success through effective collaboration and technical expertise.';
    }

    // If description doesn't start with an action verb, add one
    const actionVerbs = ['Developed', 'Implemented', 'Designed', 'Led', 'Managed', 'Created'];
    const startsWithActionVerb = actionVerbs.some((verb) =>
      description.trim().toLowerCase().startsWith(verb.toLowerCase()),
    );

    if (!startsWithActionVerb) {
      return `Developed and ${description.charAt(0).toLowerCase()}${description.slice(1)}`;
    }

    return description;
  }
}
