import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductivityService } from './productivity.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Productivity')
@Controller('productivity')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductivityController {
  constructor(private readonly productivityService: ProductivityService) {}

  @Post('tasks')
  @ApiOperation({ summary: 'Create a new task' })
  async createTask(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return await this.productivityService.createTask(userId, dto);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get all tasks with filtering and sorting' })
  async getTasks(
    @CurrentUser('id') userId: string,
    @Query() query: QueryTasksDto,
  ) {
    return await this.productivityService.getTasks(userId, query);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get a task by ID' })
  async getTaskById(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
  ) {
    return await this.productivityService.getTaskById(userId, taskId);
  }

  @Put('tasks/:id')
  @ApiOperation({ summary: 'Update a task' })
  async updateTask(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return await this.productivityService.updateTask(userId, taskId, dto);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Delete a task' })
  async deleteTask(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
  ) {
    await this.productivityService.deleteTask(userId, taskId);
    return { message: 'Task deleted successfully' };
  }

  @Put('tasks/:id/status')
  @ApiOperation({ summary: 'Update task status' })
  async updateTaskStatus(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Body('status') status: 'todo' | 'in_progress' | 'done',
  ) {
    return await this.productivityService.updateTaskStatus(
      userId,
      taskId,
      status,
    );
  }

  // Timer endpoints
  @Post('timer/start')
  @ApiOperation({ summary: 'Start a focus timer' })
  async startTimer(
    @CurrentUser('id') userId: string,
    @Body() dto: StartTimerDto,
  ) {
    return await this.productivityService.startTimer(userId, dto);
  }

  @Put('timer/:id/stop')
  @ApiOperation({ summary: 'Stop a running timer' })
  async stopTimer(
    @CurrentUser('id') userId: string,
    @Param('id') timerId: string,
  ) {
    return await this.productivityService.stopTimer(userId, timerId);
  }

  @Put('timer/:id/interrupt')
  @ApiOperation({ summary: 'Interrupt a running timer' })
  async interruptTimer(
    @CurrentUser('id') userId: string,
    @Param('id') timerId: string,
  ) {
    return await this.productivityService.interruptTimer(userId, timerId);
  }

  @Get('timer/active')
  @ApiOperation({ summary: 'Get active timer' })
  async getActiveTimer(@CurrentUser('id') userId: string) {
    return await this.productivityService.getActiveTimer(userId);
  }

  @Get('timer/history')
  @ApiOperation({ summary: 'Get timer history' })
  async getTimerHistory(@CurrentUser('id') userId: string) {
    return await this.productivityService.getTimerHistory(userId);
  }

  @Get('timer/:id')
  @ApiOperation({ summary: 'Get timer by ID' })
  async getTimerById(
    @CurrentUser('id') userId: string,
    @Param('id') timerId: string,
  ) {
    return await this.productivityService.getTimerById(userId, timerId);
  }

  // Note endpoints
  @Post('notes')
  @ApiOperation({ summary: 'Create a new note' })
  async createNote(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return await this.productivityService.createNote(userId, dto);
  }

  @Get('notes')
  @ApiOperation({ summary: 'Get all notes, optionally filtered by tag' })
  async getNotes(
    @CurrentUser('id') userId: string,
    @Query('tag') tag?: string,
  ) {
    return await this.productivityService.getNotes(userId, tag);
  }

  @Get('notes/search')
  @ApiOperation({ summary: 'Search notes by title or content' })
  async searchNotes(
    @CurrentUser('id') userId: string,
    @Query('q') query: string,
  ) {
    return await this.productivityService.searchNotes(userId, query);
  }

  @Get('notes/:id')
  @ApiOperation({ summary: 'Get a note by ID' })
  async getNoteById(
    @CurrentUser('id') userId: string,
    @Param('id') noteId: string,
  ) {
    return await this.productivityService.getNoteById(userId, noteId);
  }

  @Put('notes/:id')
  @ApiOperation({ summary: 'Update a note' })
  async updateNote(
    @CurrentUser('id') userId: string,
    @Param('id') noteId: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return await this.productivityService.updateNote(userId, noteId, dto);
  }

  @Delete('notes/:id')
  @ApiOperation({ summary: 'Delete a note' })
  async deleteNote(
    @CurrentUser('id') userId: string,
    @Param('id') noteId: string,
  ) {
    await this.productivityService.deleteNote(userId, noteId);
    return { message: 'Note deleted successfully' };
  }

  @Post('notes/:id/summarize')
  @ApiOperation({ summary: 'Generate a summary for a note' })
  async summarizeNote(
    @CurrentUser('id') userId: string,
    @Param('id') noteId: string,
  ) {
    const summary = await this.productivityService.summarizeNote(userId, noteId);
    return { summary };
  }

  // Reminder endpoints
  @Post('reminders')
  @ApiOperation({ summary: 'Create a new reminder' })
  async createReminder(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReminderDto,
  ) {
    return await this.productivityService.createReminder(userId, dto);
  }

  @Get('reminders')
  @ApiOperation({ summary: 'Get all reminders' })
  async getReminders(@CurrentUser('id') userId: string) {
    return await this.productivityService.getReminders(userId);
  }

  @Get('reminders/:id')
  @ApiOperation({ summary: 'Get a reminder by ID' })
  async getReminderById(
    @CurrentUser('id') userId: string,
    @Param('id') reminderId: string,
  ) {
    return await this.productivityService.getReminderById(userId, reminderId);
  }

  @Delete('reminders/:id')
  @ApiOperation({ summary: 'Delete a reminder' })
  async deleteReminder(
    @CurrentUser('id') userId: string,
    @Param('id') reminderId: string,
  ) {
    await this.productivityService.deleteReminder(userId, reminderId);
    return { message: 'Reminder deleted successfully' };
  }
}
