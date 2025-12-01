import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { GitHubService } from './github.service';
import { ProjectIdea } from '../../entities/project-idea.entity';
import { ProjectArchitecture } from '../../entities/project-architecture.entity';
import { CodeFile } from '../../entities/code-file.entity';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectIdea, ProjectArchitecture, CodeFile]),
    AIModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, GitHubService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
