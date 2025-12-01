import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { InterviewService } from './interview.service';
import { VoiceService } from './voice.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Interview')
@Controller('interview')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InterviewController {
  constructor(
    private readonly interviewService: InterviewService,
    private readonly voiceService: VoiceService,
  ) {}

  @Post('session')
  @ApiOperation({ summary: 'Start a new interview session' })
  async startSession(
    @CurrentUser('id') userId: string,
    @Body() dto: StartSessionDto,
  ) {
    return this.interviewService.startSession(userId, dto);
  }

  @Get('session/:id')
  @ApiOperation({ summary: 'Get interview session details' })
  async getSession(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewService.getSession(sessionId, userId);
  }

  @Get('session/:id/question')
  @ApiOperation({ summary: 'Get next question in session' })
  async getNextQuestion(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewService.getNextQuestion(sessionId, userId);
  }

  @Post('session/:id/answer')
  @ApiOperation({ summary: 'Submit answer to a question' })
  async submitAnswer(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.interviewService.submitAnswer(sessionId, userId, dto);
  }

  @Post('session/:id/complete')
  @ApiOperation({ summary: 'Complete interview session and get summary' })
  async completeSession(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.interviewService.completeSession(sessionId, userId);
  }

  @Get('practice')
  @ApiOperation({ summary: 'Get practice questions from question bank' })
  async getPracticeQuestions(
    @Query('type') type?: 'dsa' | 'system_design' | 'behavioral',
    @Query('difficulty') difficulty?: 'easy' | 'medium' | 'hard',
  ) {
    return this.interviewService.getPracticeQuestions(type, difficulty);
  }

  @Post('voice/transcribe')
  @ApiOperation({ summary: 'Transcribe audio to text for voice mode' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribeAudio(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }

    // Validate file size
    if (file.size > this.voiceService.getMaxAudioSize()) {
      throw new BadRequestException('Audio file is too large (max 25MB)');
    }

    // Validate file format
    if (!this.voiceService.isValidAudioFormat(file.mimetype)) {
      throw new BadRequestException('Invalid audio format');
    }

    const transcription = await this.voiceService.transcribeAudio(
      file.buffer,
      file.mimetype,
    );

    return { text: transcription };
  }

  @Post('voice/synthesize')
  @ApiOperation({ summary: 'Convert text to speech for voice mode' })
  async synthesizeSpeech(
    @Body() body: { text: string; voice?: string },
    @Res() res: Response,
  ) {
    if (!body.text) {
      throw new BadRequestException('Text is required');
    }

    const audioBuffer = await this.voiceService.synthesizeSpeech(
      body.text,
      body.voice,
    );

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });

    res.send(audioBuffer);
  }
}
