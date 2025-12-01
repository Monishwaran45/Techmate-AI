// User & Authentication Types
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'developer' | 'professional';
  profile: UserProfile;
  subscription: Subscription;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  name: string;
  avatar?: string;
  skills: string[];
  goals: string[];
  experience: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

export interface Subscription {
  userId: string;
  tier: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate?: Date;
}

// Learning Types
export interface Roadmap {
  id: string;
  userId: string;
  title: string;
  milestones: Milestone[];
  createdAt: Date;
}

export interface Milestone {
  id: string;
  roadmapId: string;
  title: string;
  description: string;
  topics: string[];
  resources: Resource[];
  order: number;
  completed: boolean;
  completedAt?: Date;
}

export interface Resource {
  title: string;
  url: string;
  type: 'article' | 'video' | 'course' | 'documentation';
}

export interface Progress {
  userId: string;
  milestoneId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  lastAccessedAt: Date;
}

// Project Types
export interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  technologies: string[];
  estimatedHours: number;
}

export interface ProjectArchitecture {
  id: string;
  projectIdeaId: string;
  folderStructure: FolderNode;
  techStack: TechStack;
  tasks: ProjectTask[];
  dependencies: Dependency[];
}

export interface FolderNode {
  name: string;
  type: 'file' | 'folder';
  children?: FolderNode[];
}

export interface TechStack {
  frontend?: string[];
  backend?: string[];
  database?: string[];
  devOps?: string[];
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface Dependency {
  name: string;
  version: string;
  type: 'production' | 'development';
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
}

// Interview Types
export interface InterviewSession {
  id: string;
  userId: string;
  type: 'dsa' | 'system_design' | 'behavioral';
  questions: Question[];
  answers: Answer[];
  status: 'active' | 'completed';
  startedAt: Date;
  completedAt?: Date;
}

export interface Question {
  id: string;
  sessionId: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  content: string;
  hints?: string[];
}

export interface Answer {
  id: string;
  questionId: string;
  content: string;
  evaluation: Evaluation;
  submittedAt: Date;
}

export interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

// Job Matching Types
export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  parsedData: ParsedResume;
  score?: ResumeScore;
  uploadedAt: Date;
}

export interface ParsedResume {
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  summary?: string;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationDate: Date;
}

export interface ResumeScore {
  resumeId: string;
  overallScore: number;
  atsCompatibility: number;
  contentQuality: number;
  suggestions: string[];
  calculatedAt: Date;
}

export interface JobMatch {
  id: string;
  userId: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  matchReasons: string[];
  jobUrl?: string;
}

// Productivity Types
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TimerSession {
  id: string;
  userId: string;
  duration: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  message: string;
  scheduledFor: Date;
  sent: boolean;
}

// Vector Storage Types
export interface EmbeddingDocument {
  id: string;
  userId: string;
  sourceType: 'code' | 'documentation' | 'note';
  sourceId: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  createdAt: Date;
}

// API Types
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
