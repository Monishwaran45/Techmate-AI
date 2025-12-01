import { Injectable, BadRequestException } from '@nestjs/common';

interface ParsedResume {
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  experience: Array<{
    company: string;
    position: string;
    startDate: Date;
    endDate?: Date;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: Date;
  }>;
  summary?: string;
}

@Injectable()
export class ResumeParserService {
  /**
   * Parse resume from PDF buffer
   */
  async parseResume(buffer: Buffer, _fileName: string): Promise<ParsedResume> {
    try {
      // Import pdf-parse - it's a CommonJS module
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      const text = data.text;

      return this.extractResumeData(text);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to parse resume: ${errorMessage}`
      );
    }
  }

  /**
   * Extract structured data from resume text
   */
  private extractResumeData(text: string): ParsedResume {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

    return {
      name: this.extractName(lines),
      email: this.extractEmail(text),
      phone: this.extractPhone(text),
      skills: this.extractSkills(text),
      experience: this.extractExperience(text),
      education: this.extractEducation(text),
      summary: this.extractSummary(text),
    };
  }

  /**
   * Extract name from resume (typically first line)
   */
  private extractName(lines: string[]): string {
    // Name is usually the first line or first non-empty line
    const name = lines[0] || 'Unknown';
    return name.length > 100 ? name.substring(0, 100) : name;
  }

  /**
   * Extract email using regex
   */
  private extractEmail(text: string): string {
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
  }

  /**
   * Extract phone number using regex
   */
  private extractPhone(text: string): string | undefined {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const match = text.match(phoneRegex);
    return match ? match[0] : undefined;
  }

  /**
   * Extract skills from resume
   */
  private extractSkills(text: string): string[] {
    const skills: string[] = [];
    const skillsSection = this.extractSection(text, ['skills', 'technical skills', 'technologies']);

    if (skillsSection) {
      // Common programming languages and technologies
      const commonSkills = [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Ruby', 'Go', 'Rust',
        'React', 'Angular', 'Vue', 'Node.js', 'Express', 'NestJS', 'Django', 'Flask',
        'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure',
        'GCP', 'Git', 'CI/CD', 'REST', 'GraphQL', 'HTML', 'CSS', 'SQL', 'NoSQL',
        'Machine Learning', 'AI', 'TensorFlow', 'PyTorch', 'Spring Boot', 'Laravel',
        'Next.js', 'Tailwind', 'Bootstrap', 'Jest', 'Mocha', 'Pytest', 'JUnit'
      ];

      for (const skill of commonSkills) {
        // Escape special regex characters
        const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
        if (regex.test(skillsSection)) {
          skills.push(skill);
        }
      }
    }

    return [...new Set(skills)]; // Remove duplicates
  }

  /**
   * Extract work experience from resume
   */
  private extractExperience(text: string): Array<{
    company: string;
    position: string;
    startDate: Date;
    endDate?: Date;
    description: string;
  }> {
    const experience: Array<{
      company: string;
      position: string;
      startDate: Date;
      endDate?: Date;
      description: string;
    }> = [];

    const experienceSection = this.extractSection(text, [
      'experience',
      'work experience',
      'employment',
      'professional experience',
    ]);

    if (experienceSection) {
      // Simple extraction - look for date patterns
      const dateRegex = /(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi;
      const matches = experienceSection.matchAll(dateRegex);

      for (const match of matches) {
        const startYear = parseInt(match[1]);
        const endYear = match[2].toLowerCase() === 'present' || match[2].toLowerCase() === 'current'
          ? undefined
          : parseInt(match[2]);

        experience.push({
          company: 'Company Name', // Placeholder
          position: 'Position', // Placeholder
          startDate: new Date(startYear, 0, 1),
          endDate: endYear ? new Date(endYear, 11, 31) : undefined,
          description: 'Work experience description',
        });
      }
    }

    return experience;
  }

  /**
   * Extract education from resume
   */
  private extractEducation(text: string): Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: Date;
  }> {
    const education: Array<{
      institution: string;
      degree: string;
      field: string;
      graduationDate: Date;
    }> = [];

    const educationSection = this.extractSection(text, [
      'education',
      'academic background',
      'qualifications',
    ]);

    if (educationSection) {
      // Look for degree keywords
      const degreeKeywords = ['bachelor', 'master', 'phd', 'doctorate', 'associate', 'b.s.', 'm.s.', 'b.a.', 'm.a.'];
      const hasDegree = degreeKeywords.some((keyword) =>
        educationSection.toLowerCase().includes(keyword)
      );

      if (hasDegree) {
        // Extract year
        const yearRegex = /\b(19|20)\d{2}\b/;
        const yearMatch = educationSection.match(yearRegex);
        const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

        education.push({
          institution: 'University Name', // Placeholder
          degree: 'Degree', // Placeholder
          field: 'Field of Study', // Placeholder
          graduationDate: new Date(year, 5, 1),
        });
      }
    }

    return education;
  }

  /**
   * Extract summary/objective from resume
   */
  private extractSummary(text: string): string | undefined {
    const summarySection = this.extractSection(text, [
      'summary',
      'objective',
      'profile',
      'about',
      'professional summary',
    ]);

    if (summarySection) {
      // Take first 500 characters
      return summarySection.substring(0, 500);
    }

    return undefined;
  }

  /**
   * Extract a section from resume text based on headers
   */
  private extractSection(text: string, headers: string[]): string | null {
    const lowerText = text.toLowerCase();

    for (const header of headers) {
      const headerIndex = lowerText.indexOf(header);
      if (headerIndex !== -1) {
        // Find the next section header or end of text
        const nextSectionRegex = /\n\s*[A-Z][A-Za-z\s]+:\s*\n/g;
        nextSectionRegex.lastIndex = headerIndex + header.length;
        const nextMatch = nextSectionRegex.exec(text);

        const endIndex = nextMatch ? nextMatch.index : text.length;
        return text.substring(headerIndex + header.length, endIndex).trim();
      }
    }

    return null;
  }
}
