import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JobNotificationService } from './job-notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { JobPreferencesDto } from './dto/job-preferences.dto';
import { ResumeFileValidation } from '../../common/pipes/file-validation.pipe';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobNotificationService: JobNotificationService,
  ) {}

  @Post('resume/upload')
  @ApiOperation({ summary: 'Upload and parse a resume' })
  @ApiResponse({ status: 201, description: 'Resume uploaded and parsed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Resume file (PDF, DOC, DOCX) - Max 5MB',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @CurrentUser() user: User,
    @UploadedFile(ResumeFileValidation) file: Express.Multer.File,
  ) {
    return await this.jobsService.uploadResume(user.id, file);
  }

  @Get('resume/:id')
  @ApiOperation({ summary: 'Get resume by ID' })
  @ApiResponse({ status: 200, description: 'Resume retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async getResume(@Param('id') id: string) {
    return await this.jobsService.getResumeById(id);
  }

  @Get('resumes')
  @ApiOperation({ summary: 'Get all resumes for current user' })
  @ApiResponse({ status: 200, description: 'Resumes retrieved successfully' })
  async getUserResumes(@CurrentUser() user: User) {
    return await this.jobsService.getUserResumes(user.id);
  }

  @Post('resume/:id/score')
  @ApiOperation({ summary: 'Calculate resume score' })
  @ApiResponse({ status: 200, description: 'Resume scored successfully' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async scoreResume(@Param('id') id: string) {
    return await this.jobsService.scoreResume(id);
  }

  @Get('resume/:id/score')
  @ApiOperation({ summary: 'Get resume score' })
  @ApiResponse({ status: 200, description: 'Resume score retrieved' })
  @ApiResponse({ status: 404, description: 'Resume or score not found' })
  async getResumeScore(@Param('id') id: string) {
    return await this.jobsService.getResumeScore(id);
  }

  @Post('resume/:id/optimize')
  @ApiOperation({ summary: 'Optimize resume for ATS compatibility' })
  @ApiResponse({ status: 200, description: 'Resume optimized successfully' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async optimizeResume(@Param('id') id: string) {
    return await this.jobsService.optimizeResume(id);
  }

  @Post('match')
  @ApiOperation({ summary: 'Match jobs based on preferences' })
  @ApiResponse({ status: 200, description: 'Job matches generated successfully' })
  async matchJobs(
    @CurrentUser() user: User,
    @Body() preferences: JobPreferencesDto,
  ) {
    return await this.jobsService.matchJobs(user.id, preferences);
  }

  @Get('matches')
  @ApiOperation({ summary: 'Get user job matches' })
  async getUserJobMatches(@CurrentUser() user: User) {
    return await this.jobsService.getUserJobMatches(user.id);
  }

  @Post('notifications/check')
  @ApiOperation({ summary: 'Manually trigger notification check for new jobs' })
  async triggerNotificationCheck(@CurrentUser() user: User) {
    await this.jobNotificationService.triggerNotificationCheck(user.id);
    return { message: 'Notification check triggered successfully' };
  }

  @Get('notifications/stats')
  @ApiOperation({ summary: 'Get notification queue statistics' })
  async getNotificationStats() {
    return await this.jobNotificationService.getQueueStats();
  }
}
