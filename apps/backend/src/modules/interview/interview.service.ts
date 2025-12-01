import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewSession } from '../../entities/interview-session.entity';
import { Question } from '../../entities/question.entity';
import { Answer } from '../../entities/answer.entity';
import { AIService } from '../ai/ai.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);

  constructor(
    @InjectRepository(InterviewSession)
    private readonly sessionRepository: Repository<InterviewSession>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    private readonly aiService: AIService,
  ) {}

  /**
   * Start a new interview session with generated questions
   */
  async startSession(userId: string, dto: StartSessionDto): Promise<InterviewSession> {
    this.logger.log(`Starting ${dto.type} interview session for user ${userId}`);

    // Create session
    const session = this.sessionRepository.create({
      userId,
      type: dto.type,
      voiceModeEnabled: dto.voiceModeEnabled || false,
      status: 'active',
      startedAt: new Date(),
    });

    const savedSession = await this.sessionRepository.save(session);

    // Generate questions based on interview type
    const questions = await this.generateQuestions(savedSession.id, dto.type);
    
    // Save questions
    await this.questionRepository.save(questions);

    // Reload session with questions
    return this.sessionRepository.findOne({
      where: { id: savedSession.id },
      relations: ['questions'],
    });
  }

  /**
   * Generate questions based on interview type
   */
  private async generateQuestions(
    sessionId: string,
    type: 'dsa' | 'system_design' | 'behavioral',
  ): Promise<Question[]> {
    const prompt = this.getQuestionGenerationPrompt(type);
    
    const response = await this.aiService.chat([
      {
        role: 'system',
        content: 'You are an expert technical interviewer. Generate interview questions in JSON format.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // Parse AI response
    const questionsData = this.parseQuestionsFromResponse(response.content, type);

    // Create question entities
    return questionsData.map((q, index) =>
      this.questionRepository.create({
        sessionId,
        type,
        difficulty: q.difficulty,
        content: q.content,
        hints: q.hints,
        order: index,
      }),
    );
  }

  /**
   * Get prompt template for question generation
   */
  private getQuestionGenerationPrompt(type: string): string {
    const prompts = {
      dsa: `Generate 5 Data Structures and Algorithms interview questions.
Include a mix of difficulties: 2 easy, 2 medium, 1 hard.
For each question, provide:
- content: The problem statement
- difficulty: easy, medium, or hard
- hints: Array of 2-3 hints

Return as JSON array: [{"content": "...", "difficulty": "...", "hints": ["...", "..."]}]`,

      system_design: `Generate 3 System Design interview questions.
Include a mix of difficulties: 1 easy, 1 medium, 1 hard.
For each question, provide:
- content: The system design problem
- difficulty: easy, medium, or hard
- hints: Array of 2-3 hints about key considerations

Return as JSON array: [{"content": "...", "difficulty": "...", "hints": ["...", "..."]}]`,

      behavioral: `Generate 5 Behavioral interview questions.
Include a mix of difficulties: 2 easy, 2 medium, 1 hard.
For each question, provide:
- content: The behavioral question
- difficulty: easy, medium, or hard
- hints: Array of 2-3 hints about what to focus on

Return as JSON array: [{"content": "...", "difficulty": "...", "hints": ["...", "..."]}]`,
    };

    return prompts[type] || prompts.dsa;
  }

  /**
   * Parse questions from AI response
   */
  private parseQuestionsFromResponse(
    content: string,
    type: string,
  ): Array<{ content: string; difficulty: 'easy' | 'medium' | 'hard'; hints: string[] }> {
    try {
      this.logger.debug(`Parsing questions from: ${content.substring(0, 300)}...`);
      
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.includes('```')) {
        const jsonMatch = cleanContent.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          cleanContent = jsonMatch[1].trim();
        }
      }
      
      // Try to extract JSON array from response
      const jsonArrayMatch = cleanContent.match(/\[[\s\S]*\]/);
      if (!jsonArrayMatch) {
        this.logger.warn('No JSON array found in response, using fallback');
        return this.getFallbackQuestions(type);
      }

      const questions = JSON.parse(jsonArrayMatch[0]);
      
      // Validate structure
      if (!Array.isArray(questions) || questions.length === 0) {
        this.logger.warn('Invalid questions format, using fallback');
        return this.getFallbackQuestions(type);
      }

      return questions.map((q) => ({
        content: q.content || q.question || q.text || '',
        difficulty: this.normalizeDifficulty(q.difficulty),
        hints: Array.isArray(q.hints) ? q.hints : [],
      }));
    } catch (error) {
      this.logger.error(`Failed to parse questions: ${(error as Error).message}`);
      // Return fallback questions
      return this.getFallbackQuestions(type);
    }
  }

  /**
   * Normalize difficulty to valid enum value
   */
  private normalizeDifficulty(difficulty: string): 'easy' | 'medium' | 'hard' {
    const normalized = difficulty?.toLowerCase();
    if (normalized === 'easy' || normalized === 'medium' || normalized === 'hard') {
      return normalized;
    }
    return 'medium'; // default
  }

  /**
   * Get fallback questions if AI generation fails
   */
  private getFallbackQuestions(
    type: string,
  ): Array<{ content: string; difficulty: 'easy' | 'medium' | 'hard'; hints: string[] }> {
    const fallbacks = {
      dsa: [
        {
          content: 'Implement a function to reverse a linked list.',
          difficulty: 'easy' as const,
          hints: ['Consider using iteration', 'Track previous, current, and next nodes'],
        },
        {
          content: 'Find the longest substring without repeating characters.',
          difficulty: 'medium' as const,
          hints: ['Use sliding window technique', 'Track character positions with a hash map'],
        },
      ],
      system_design: [
        {
          content: 'Design a URL shortening service like bit.ly.',
          difficulty: 'medium' as const,
          hints: ['Consider hash functions', 'Think about database schema', 'Plan for scalability'],
        },
      ],
      behavioral: [
        {
          content: 'Tell me about a time you faced a challenging technical problem.',
          difficulty: 'easy' as const,
          hints: ['Use STAR method', 'Focus on your specific actions'],
        },
        {
          content: 'Describe a situation where you had to work with a difficult team member.',
          difficulty: 'medium' as const,
          hints: ['Show empathy and communication skills', 'Highlight positive outcome'],
        },
      ],
    };

    return fallbacks[type] || fallbacks.dsa;
  }

  /**
   * Get next question in session
   */
  async getNextQuestion(sessionId: string, userId: string): Promise<Question | null> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
      relations: ['questions', 'answers'],
    });

    if (!session) {
      throw new NotFoundException('Interview session not found');
    }

    if (session.status === 'completed') {
      return null;
    }

    // Find first unanswered question
    const answeredQuestionIds = session.answers.map((a) => a.questionId);
    const nextQuestion = session.questions
      .sort((a, b) => a.order - b.order)
      .find((q) => !answeredQuestionIds.includes(q.id));

    return nextQuestion || null;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string, userId: string): Promise<InterviewSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
      relations: ['questions', 'answers', 'answers.question'],
    });

    if (!session) {
      throw new NotFoundException('Interview session not found');
    }

    return session;
  }

  /**
   * Submit an answer and get evaluation
   */
  async submitAnswer(
    sessionId: string,
    userId: string,
    dto: SubmitAnswerDto,
  ): Promise<Answer> {
    const session = await this.getSession(sessionId, userId);

    if (session.status === 'completed') {
      throw new BadRequestException('Interview session is already completed');
    }

    // Verify question belongs to session
    const question = session.questions.find((q) => q.id === dto.questionId);
    if (!question) {
      throw new NotFoundException('Question not found in this session');
    }

    // Check if already answered
    const existingAnswer = session.answers.find((a) => a.questionId === dto.questionId);
    if (existingAnswer) {
      throw new BadRequestException('Question already answered');
    }

    // Evaluate answer using AI
    const evaluation = await this.evaluateAnswer(question, dto.content, session.type);

    // Create and save answer
    const answer = this.answerRepository.create({
      sessionId,
      questionId: dto.questionId,
      content: dto.content,
      audioUrl: dto.audioUrl,
      evaluation,
      submittedAt: new Date(),
    });

    return this.answerRepository.save(answer);
  }

  /**
   * Evaluate an answer using AI
   */
  private async evaluateAnswer(
    question: Question,
    answerContent: string,
    interviewType: string,
  ): Promise<{ score: number; feedback: string; strengths: string[]; improvements: string[] }> {
    const prompt = this.getEvaluationPrompt(question, answerContent, interviewType);

    const response = await this.aiService.chat([
      {
        role: 'system',
        content: 'You are an expert technical interviewer providing constructive feedback.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return this.parseEvaluationFromResponse(response.content);
  }

  /**
   * Get evaluation prompt template
   */
  private getEvaluationPrompt(question: Question, answer: string, type: string): string {
    const typeSpecific = {
      dsa: 'Focus on algorithm correctness, time/space complexity, code quality, and edge cases.',
      system_design: 'Focus on scalability, reliability, component design, and trade-offs.',
      behavioral: 'Focus on communication, problem-solving approach, and leadership qualities.',
    };

    return `Evaluate this interview answer.

Question: ${question.content}
Answer: ${answer}

Interview Type: ${type}
${typeSpecific[type] || ''}

Provide evaluation in JSON format:
{
  "score": <number 0-100>,
  "feedback": "<overall feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}`;
  }

  /**
   * Parse evaluation from AI response
   */
  private parseEvaluationFromResponse(content: string): {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  } {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const evaluation = JSON.parse(jsonMatch[0]);

      return {
        score: Math.min(100, Math.max(0, evaluation.score || 50)),
        feedback: evaluation.feedback || 'Good effort!',
        strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
        improvements: Array.isArray(evaluation.improvements) ? evaluation.improvements : [],
      };
    } catch (error) {
      this.logger.error(`Failed to parse evaluation: ${(error as Error).message}`);
      return {
        score: 50,
        feedback: 'Your answer has been recorded. Keep practicing!',
        strengths: ['Attempted the question'],
        improvements: ['Consider providing more detail'],
      };
    }
  }

  /**
   * Complete session and generate summary
   */
  async completeSession(sessionId: string, userId: string): Promise<InterviewSession> {
    const session = await this.getSession(sessionId, userId);

    if (session.status === 'completed') {
      throw new BadRequestException('Interview session is already completed');
    }

    // Calculate overall metrics
    const scores = session.answers.map((a) => a.evaluation.score);
    const overallScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0;

    // Aggregate strengths and improvements
    const allStrengths = session.answers.flatMap((a) => a.evaluation.strengths);
    const allImprovements = session.answers.flatMap((a) => a.evaluation.improvements);

    // Get unique top items
    const strengths = [...new Set(allStrengths)].slice(0, 5);
    const improvements = [...new Set(allImprovements)].slice(0, 5);

    // Update session
    session.status = 'completed';
    session.completedAt = new Date();
    session.summary = {
      overallScore,
      strengths,
      improvements,
    };

    return this.sessionRepository.save(session);
  }

  /**
   * Get practice questions (question bank)
   */
  async getPracticeQuestions(
    type?: 'dsa' | 'system_design' | 'behavioral',
    difficulty?: 'easy' | 'medium' | 'hard',
  ): Promise<Question[]> {
    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.session', 'session')
      .where('session.status = :status', { status: 'completed' });

    if (type) {
      queryBuilder.andWhere('question.type = :type', { type });
    }

    if (difficulty) {
      queryBuilder.andWhere('question.difficulty = :difficulty', { difficulty });
    }

    queryBuilder.orderBy('RANDOM()').limit(20);

    return queryBuilder.getMany();
  }
}
