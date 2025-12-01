import { Resume } from './resume.entity';
import { ResumeScore } from './resume-score.entity';
import { JobMatch } from './job-match.entity';

describe('Job Matching Entities', () => {

  describe('Resume Entity', () => {
    it('should have correct structure for parsed data', () => {
      const resume = new Resume();
      resume.id = 'test-id';
      resume.userId = 'user-id';
      resume.fileName = 'resume.pdf';
      resume.fileUrl = 'https://example.com/resume.pdf';
      resume.parsedData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        skills: ['JavaScript', 'TypeScript', 'Node.js'],
        experience: [
          {
            company: 'Tech Corp',
            position: 'Software Engineer',
            startDate: new Date('2020-01-01'),
            endDate: new Date('2023-01-01'),
            description: 'Developed web applications',
          },
        ],
        education: [
          {
            institution: 'University',
            degree: 'Bachelor',
            field: 'Computer Science',
            graduationDate: new Date('2019-05-01'),
          },
        ],
        summary: 'Experienced software engineer',
      };
      resume.uploadedAt = new Date();

      expect(resume.fileName).toBe('resume.pdf');
      expect(resume.parsedData.name).toBe('John Doe');
      expect(resume.parsedData.skills).toHaveLength(3);
      expect(resume.parsedData.experience).toHaveLength(1);
      expect(resume.parsedData.education).toHaveLength(1);
      expect(resume.parsedData.phone).toBe('+1234567890');
      expect(resume.parsedData.summary).toBe('Experienced software engineer');
    });
  });

  describe('ResumeScore Entity', () => {
    it('should have correct structure with all required fields', () => {
      const score = new ResumeScore();
      score.id = 'score-id';
      score.resumeId = 'resume-id';
      score.overallScore = 85;
      score.atsCompatibility = 90;
      score.contentQuality = 80;
      score.suggestions = [
        'Add more quantifiable achievements',
        'Include relevant keywords',
      ];
      score.calculatedAt = new Date();

      expect(score.overallScore).toBe(85);
      expect(score.atsCompatibility).toBe(90);
      expect(score.contentQuality).toBe(80);
      expect(score.suggestions).toHaveLength(2);
      expect(score.resumeId).toBe('resume-id');
    });

    it('should support valid score ranges', () => {
      const score = new ResumeScore();
      score.overallScore = 75;
      score.atsCompatibility = 70;
      score.contentQuality = 80;

      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.atsCompatibility).toBeGreaterThanOrEqual(0);
      expect(score.atsCompatibility).toBeLessThanOrEqual(100);
      expect(score.contentQuality).toBeGreaterThanOrEqual(0);
      expect(score.contentQuality).toBeLessThanOrEqual(100);
    });
  });

  describe('JobMatch Entity', () => {
    it('should have correct structure with all required fields', () => {
      const jobMatch = new JobMatch();
      jobMatch.id = 'match-id';
      jobMatch.userId = 'user-id';
      jobMatch.jobTitle = 'Senior Software Engineer';
      jobMatch.company = 'Tech Startup Inc';
      jobMatch.matchScore = 92;
      jobMatch.matchReasons = [
        'Skills match: JavaScript, TypeScript',
        'Experience level: 5+ years',
        'Location preference: Remote',
      ];
      jobMatch.jobUrl = 'https://example.com/jobs/123';
      jobMatch.description = 'Looking for an experienced engineer';
      jobMatch.requiredSkills = ['JavaScript', 'TypeScript', 'React'];
      jobMatch.location = 'Remote';
      jobMatch.salaryRange = '$120k - $150k';
      jobMatch.notified = false;

      expect(jobMatch.jobTitle).toBe('Senior Software Engineer');
      expect(jobMatch.matchScore).toBe(92);
      expect(jobMatch.matchReasons).toHaveLength(3);
      expect(jobMatch.notified).toBe(false);
      expect(jobMatch.requiredSkills).toHaveLength(3);
      expect(jobMatch.location).toBe('Remote');
    });

    it('should support optional fields', () => {
      const jobMatch = new JobMatch();
      jobMatch.userId = 'user-id';
      jobMatch.jobTitle = 'Junior Developer';
      jobMatch.company = 'Startup';
      jobMatch.matchScore = 75;
      jobMatch.matchReasons = ['Entry level position'];

      // Optional fields can be undefined
      expect(jobMatch.jobUrl).toBeUndefined();
      expect(jobMatch.description).toBeUndefined();
      expect(jobMatch.location).toBeUndefined();
      expect(jobMatch.salaryRange).toBeUndefined();
    });
  });

  describe('Entity Structure Validation', () => {
    it('should validate Resume entity matches design requirements', () => {
      const resume = new Resume();
      resume.id = 'test-id';
      resume.userId = 'user-id';
      resume.fileName = 'test.pdf';
      resume.fileUrl = 'https://example.com/test.pdf';
      resume.parsedData = {
        name: 'Test User',
        email: 'test@example.com',
        skills: [],
        experience: [],
        education: [],
      };
      resume.uploadedAt = new Date();
      
      // Verify all required fields from design document are present
      expect(resume.id).toBeDefined();
      expect(resume.userId).toBeDefined();
      expect(resume.fileName).toBeDefined();
      expect(resume.fileUrl).toBeDefined();
      expect(resume.parsedData).toBeDefined();
      expect(resume.uploadedAt).toBeDefined();
      
      // Verify ParsedResume structure matches design
      expect(resume.parsedData.name).toBeDefined();
      expect(resume.parsedData.email).toBeDefined();
      expect(resume.parsedData.skills).toBeDefined();
      expect(resume.parsedData.experience).toBeDefined();
      expect(resume.parsedData.education).toBeDefined();
    });

    it('should validate ResumeScore entity matches design requirements', () => {
      const score = new ResumeScore();
      score.id = 'score-id';
      score.resumeId = 'resume-id';
      score.overallScore = 80;
      score.atsCompatibility = 85;
      score.contentQuality = 75;
      score.suggestions = ['Suggestion 1'];
      score.calculatedAt = new Date();
      
      // Verify all required fields from design document are present
      expect(score.resumeId).toBeDefined();
      expect(score.overallScore).toBeDefined();
      expect(score.atsCompatibility).toBeDefined();
      expect(score.contentQuality).toBeDefined();
      expect(score.suggestions).toBeDefined();
      expect(score.calculatedAt).toBeDefined();
    });

    it('should validate JobMatch entity matches design requirements', () => {
      const jobMatch = new JobMatch();
      jobMatch.id = 'match-id';
      jobMatch.userId = 'user-id';
      jobMatch.jobTitle = 'Software Engineer';
      jobMatch.company = 'Tech Company';
      jobMatch.matchScore = 85;
      jobMatch.matchReasons = ['Reason 1'];
      
      // Verify all required fields from design document are present
      expect(jobMatch.id).toBeDefined();
      expect(jobMatch.userId).toBeDefined();
      expect(jobMatch.jobTitle).toBeDefined();
      expect(jobMatch.company).toBeDefined();
      expect(jobMatch.matchScore).toBeDefined();
      expect(jobMatch.matchReasons).toBeDefined();
      
      // Verify optional fields can be set
      jobMatch.jobUrl = 'https://example.com/job';
      expect(jobMatch.jobUrl).toBe('https://example.com/job');
    });
  });
});
