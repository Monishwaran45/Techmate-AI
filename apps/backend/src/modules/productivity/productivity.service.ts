import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Task } from '../../entities/task.entity';
import { TimerSession } from '../../entities/timer-session.entity';
import { Note } from '../../entities/note.entity';
import { Reminder } from '../../entities/reminder.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { AIService } from '../ai/ai.service';

@Injectable()
export class ProductivityService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TimerSession)
    private readonly timerRepository: Repository<TimerSession>,
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(Reminder)
    private readonly reminderRepository: Repository<Reminder>,
    @InjectQueue('productivity-reminders')
    private readonly reminderQueue: Queue,
    private readonly aiService: AIService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    // Schedule periodic reminder checks (every minute)
    this.scheduleReminderChecks();
  }

  async createTask(userId: string, dto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      userId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority || 'medium',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      status: 'todo',
    });

    return await this.taskRepository.save(task);
  }

  async getTasks(userId: string, query: QueryTasksDto): Promise<Task[]> {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId });

    // Apply filters
    if (query.status) {
      queryBuilder.andWhere('task.status = :status', { status: query.status });
    }

    if (query.priority) {
      queryBuilder.andWhere('task.priority = :priority', {
        priority: query.priority,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Apply sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';

    // Map sortBy to actual column names
    const columnMap: Record<string, string> = {
      createdAt: 'task.created_at',
      updatedAt: 'task.updated_at',
      dueDate: 'task.due_date',
      priority: 'task.priority',
      status: 'task.status',
    };

    queryBuilder.orderBy(columnMap[sortBy], sortOrder);

    return await queryBuilder.getMany();
  }

  async getTaskById(userId: string, taskId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return task;
  }

  async updateTask(
    userId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.getTaskById(userId, taskId);

    // Update fields if provided
    if (dto.title !== undefined) {
      task.title = dto.title;
    }
    if (dto.description !== undefined) {
      task.description = dto.description;
    }
    if (dto.status !== undefined) {
      task.status = dto.status;
    }
    if (dto.priority !== undefined) {
      task.priority = dto.priority;
    }
    if (dto.dueDate !== undefined) {
      task.dueDate = new Date(dto.dueDate);
    }

    return await this.taskRepository.save(task);
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const task = await this.getTaskById(userId, taskId);
    await this.taskRepository.remove(task);
  }

  async updateTaskStatus(
    userId: string,
    taskId: string,
    status: 'todo' | 'in_progress' | 'done',
  ): Promise<Task> {
    const task = await this.getTaskById(userId, taskId);
    task.status = status;
    return await this.taskRepository.save(task);
  }

  // Timer methods
  async startTimer(userId: string, dto: StartTimerDto): Promise<TimerSession> {
    // Check if there's an active timer
    const activeTimer = await this.timerRepository.findOne({
      where: { userId, completedAt: null as any, interrupted: false },
    });

    if (activeTimer) {
      throw new BadRequestException('A timer is already running');
    }

    const timer = this.timerRepository.create({
      userId,
      duration: dto.duration,
      startedAt: new Date(),
      interrupted: false,
    });

    return await this.timerRepository.save(timer);
  }

  async stopTimer(userId: string, timerId: string): Promise<TimerSession> {
    const timer = await this.timerRepository.findOne({
      where: { id: timerId, userId },
    });

    if (!timer) {
      throw new NotFoundException(`Timer with ID ${timerId} not found`);
    }

    if (timer.completedAt) {
      throw new BadRequestException('Timer is already completed');
    }

    timer.completedAt = new Date();
    return await this.timerRepository.save(timer);
  }

  async interruptTimer(userId: string, timerId: string): Promise<TimerSession> {
    const timer = await this.timerRepository.findOne({
      where: { id: timerId, userId },
    });

    if (!timer) {
      throw new NotFoundException(`Timer with ID ${timerId} not found`);
    }

    if (timer.completedAt) {
      throw new BadRequestException('Timer is already completed');
    }

    timer.interrupted = true;
    timer.completedAt = new Date();
    return await this.timerRepository.save(timer);
  }

  async getActiveTimer(userId: string): Promise<TimerSession | null> {
    return await this.timerRepository.findOne({
      where: { userId, completedAt: null as any, interrupted: false },
    });
  }

  async getTimerHistory(userId: string): Promise<TimerSession[]> {
    return await this.timerRepository.find({
      where: { userId },
      order: { startedAt: 'DESC' },
    });
  }

  async getTimerById(userId: string, timerId: string): Promise<TimerSession> {
    const timer = await this.timerRepository.findOne({
      where: { id: timerId, userId },
    });

    if (!timer) {
      throw new NotFoundException(`Timer with ID ${timerId} not found`);
    }

    return timer;
  }

  // Note methods
  async createNote(userId: string, dto: CreateNoteDto): Promise<Note> {
    const note = this.noteRepository.create({
      userId,
      title: dto.title,
      content: dto.content,
      tags: dto.tags || [],
    });

    return await this.noteRepository.save(note);
  }

  async getNotes(userId: string, tag?: string): Promise<Note[]> {
    const queryBuilder = this.noteRepository
      .createQueryBuilder('note')
      .where('note.userId = :userId', { userId });

    if (tag) {
      queryBuilder.andWhere(':tag = ANY(note.tags)', { tag });
    }

    return await queryBuilder.orderBy('note.updated_at', 'DESC').getMany();
  }

  async getNoteById(userId: string, noteId: string): Promise<Note> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId, userId },
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    return note;
  }

  async updateNote(
    userId: string,
    noteId: string,
    dto: UpdateNoteDto,
  ): Promise<Note> {
    const note = await this.getNoteById(userId, noteId);

    if (dto.title !== undefined) {
      note.title = dto.title;
    }
    if (dto.content !== undefined) {
      note.content = dto.content;
    }
    if (dto.tags !== undefined) {
      note.tags = dto.tags;
    }

    return await this.noteRepository.save(note);
  }

  async deleteNote(userId: string, noteId: string): Promise<void> {
    const note = await this.getNoteById(userId, noteId);
    await this.noteRepository.remove(note);
  }

  async searchNotes(userId: string, query: string): Promise<Note[]> {
    return await this.noteRepository
      .createQueryBuilder('note')
      .where('note.userId = :userId', { userId })
      .andWhere(
        '(note.title ILIKE :query OR note.content ILIKE :query)',
        { query: `%${query}%` },
      )
      .orderBy('note.updated_at', 'DESC')
      .getMany();
  }

  async summarizeNote(userId: string, noteId: string): Promise<string> {
    // Get the note
    const note = await this.getNoteById(userId, noteId);

    // Check if summary already exists in cache
    const cacheKey = `note-summary:${noteId}`;
    const cachedSummary = await this.cacheManager.get<string>(cacheKey);
    
    if (cachedSummary) {
      return cachedSummary;
    }

    // Check if summary already exists in database
    if (note.summary) {
      // Cache the existing summary
      await this.cacheManager.set(cacheKey, note.summary);
      return note.summary;
    }

    // Validate that content is not empty
    if (!note.content || note.content.trim().length === 0) {
      throw new BadRequestException('Cannot summarize an empty note');
    }

    // Create summarization prompt
    const prompt = this.createSummarizationPrompt(note.title, note.content);

    // Generate summary using AI
    const response = await this.aiService.chat([
      {
        role: 'system',
        content: 'You are a helpful assistant that creates concise summaries of notes. Your summaries should be significantly shorter than the original content while capturing the key points.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    const summary = response.content.trim();

    // Validate that summary is shorter than original
    if (summary.length >= note.content.length) {
      throw new BadRequestException('Generated summary is not shorter than the original content');
    }

    // Save summary to database
    note.summary = summary;
    await this.noteRepository.save(note);

    // Cache the summary
    await this.cacheManager.set(cacheKey, summary);

    return summary;
  }

  private createSummarizationPrompt(title: string, content: string): string {
    return `Please create a concise summary of the following note. The summary should be significantly shorter than the original content while capturing all key points and main ideas.

Title: ${title}

Content:
${content}

Provide only the summary without any additional commentary or formatting.`;
  }

  // Reminder methods
  async createReminder(userId: string, dto: CreateReminderDto): Promise<Reminder> {
    const scheduledFor = new Date(dto.scheduledFor);

    // Validate that scheduled time is in the future
    if (scheduledFor <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const reminder = this.reminderRepository.create({
      userId,
      message: dto.message,
      scheduledFor,
      sent: false,
    });

    return await this.reminderRepository.save(reminder);
  }

  async getReminders(userId: string): Promise<Reminder[]> {
    return await this.reminderRepository.find({
      where: { userId },
      order: { scheduledFor: 'ASC' },
    });
  }

  async getReminderById(userId: string, reminderId: string): Promise<Reminder> {
    const reminder = await this.reminderRepository.findOne({
      where: { id: reminderId, userId },
    });

    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${reminderId} not found`);
    }

    return reminder;
  }

  async deleteReminder(userId: string, reminderId: string): Promise<void> {
    const reminder = await this.getReminderById(userId, reminderId);
    await this.reminderRepository.remove(reminder);
  }

  private async scheduleReminderChecks(): Promise<void> {
    // Add a repeatable job that runs every minute to check for due reminders
    await this.reminderQueue.add(
      'check-reminders',
      { checkTime: new Date() },
      {
        repeat: {
          every: 60000, // Every 60 seconds (1 minute)
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
