import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LearningService } from './learning.service';
import { GenerateRoadmapDto } from './dto/generate-roadmap.dto';
import { ExplainConceptDto } from './dto/explain-concept.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { GetTechNewsDto } from './dto/get-tech-news.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Learning')
@Controller('learning')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Post('roadmap')
  @ApiOperation({ summary: 'Generate a personalized learning roadmap' })
  async generateRoadmap(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateRoadmapDto,
  ) {
    return this.learningService.generateRoadmap(userId, dto);
  }

  @Post('explain')
  @ApiOperation({ summary: 'Explain a technical concept' })
  async explainConcept(
    @CurrentUser('id') userId: string,
    @Body() dto: ExplainConceptDto,
  ) {
    const explanation = await this.learningService.explainConcept(userId, dto);
    return { explanation };
  }

  @Put('progress/:milestoneId')
  @ApiOperation({ summary: 'Update progress for a milestone' })
  async updateProgress(
    @CurrentUser('id') userId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.learningService.updateProgress(userId, milestoneId, dto);
  }

  @Get('progress/stats')
  @ApiOperation({ summary: 'Get progress statistics' })
  async getProgressStats(@CurrentUser('id') userId: string) {
    return this.learningService.getProgressStats(userId);
  }

  @Get('roadmap/active')
  @ApiOperation({ summary: 'Get active roadmap' })
  async getActiveRoadmap(@CurrentUser('id') userId: string) {
    return this.learningService.getActiveRoadmap(userId);
  }

  @Post('news')
  @ApiOperation({ summary: 'Get tech news summaries' })
  async getTechNews(@Body() dto: GetTechNewsDto) {
    return this.learningService.getTechNews(dto);
  }
}
