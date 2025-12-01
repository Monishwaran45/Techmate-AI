import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { GenerateIdeasDto } from './dto/generate-ideas.dto';
import { ExportGitHubDto } from './dto/export-github.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('ideas')
  @ApiOperation({ summary: 'Generate project ideas' })
  async generateIdeas(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateIdeasDto,
  ) {
    return this.projectsService.generateIdeas(userId, dto);
  }

  @Get('ideas')
  @ApiOperation({ summary: 'Get user project ideas' })
  async getUserProjectIdeas(@CurrentUser('id') userId: string) {
    return this.projectsService.getUserProjectIdeas(userId);
  }

  @Get('ideas/:id')
  @ApiOperation({ summary: 'Get a specific project idea' })
  async getProjectIdea(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.projectsService.getProjectIdea(id, userId);
  }

  @Post('architecture')
  @ApiOperation({ summary: 'Generate project architecture' })
  async generateArchitecture(
    @CurrentUser('id') userId: string,
    @Body() dto: { projectIdeaId: string },
  ) {
    return this.projectsService.generateArchitecture(dto.projectIdeaId, userId);
  }

  @Post('code')
  @ApiOperation({ summary: 'Generate starter code' })
  async generateStarterCode(
    @CurrentUser('id') userId: string,
    @Body() dto: { architectureId: string },
  ) {
    return this.projectsService.generateStarterCode(dto.architectureId, userId);
  }

  @Get('architecture/:id/code')
  @ApiOperation({ summary: 'Get code files for an architecture' })
  async getCodeFiles(@Param('id') architectureId: string) {
    return this.projectsService.getCodeFiles(architectureId);
  }

  @Post('export/github')
  @ApiOperation({ summary: 'Export project to GitHub' })
  async exportToGitHub(
    @CurrentUser('id') userId: string,
    @Body() dto: ExportGitHubDto,
  ) {
    return this.projectsService.exportToGitHub(
      dto.architectureId,
      userId,
      dto.githubToken,
      dto.repositoryName,
      dto.description,
      dto.isPrivate,
    );
  }
}
