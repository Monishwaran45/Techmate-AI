import { create } from 'zustand';
import { api } from '../lib/api';

interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  topics?: string[];
}

interface Roadmap {
  id: string;
  title: string;
  milestones: Milestone[];
}

interface ProgressStats {
  totalMilestones: number;
  completedMilestones: number;
  inProgressMilestones: number;
  completionPercentage: number;
  currentStreak?: number;
  totalHoursLearned?: number;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
}

interface LearningState {
  roadmap: Roadmap | null;
  progressStats: ProgressStats | null;
  news: NewsItem[];
  loading: boolean;
  error: string | null;
  fetchRoadmap: () => Promise<void>;
  generateRoadmap: (skills: string[], goals: string[], experience: string) => Promise<void>;
  updateProgress: (milestoneId: string) => Promise<void>;
  fetchProgressStats: () => Promise<void>;
  fetchNews: (topics: string[]) => Promise<void>;
  explainConcept: (concept: string, context?: string) => Promise<string>;
}

export const useLearningStore = create<LearningState>((set, get) => ({
  roadmap: null,
  progressStats: null,
  news: [],
  loading: false,
  error: null,

  fetchRoadmap: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/learning/roadmap/active');
      set({ roadmap: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  generateRoadmap: async (skills, goals, experience) => {
    set({ loading: true, error: null });
    try {
      // Map experience to skillLevel enum
      const skillLevelMap: Record<string, string> = {
        'beginner': 'beginner',
        'intermediate': 'intermediate', 
        'advanced': 'advanced',
        'expert': 'advanced',
      };
      const skillLevel = skillLevelMap[experience] || 'beginner';
      
      // Combine skills and goals for the goals array (backend expects goals)
      const combinedGoals = goals.length > 0 ? goals : (skills.length > 0 ? [`Learn ${skills[0]}`] : ['Learn programming']);
      
      const response = await api.post('/api/learning/roadmap', {
        goals: combinedGoals.slice(0, 5), // Max 5 goals
        skillLevel,
      });
      set({ roadmap: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateProgress: async (milestoneId) => {
    try {
      await api.put(`/api/learning/progress/${milestoneId}`, { completed: true });
      const roadmap = get().roadmap;
      if (roadmap) {
        const updatedMilestones = roadmap.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: true } : m
        );
        set({ roadmap: { ...roadmap, milestones: updatedMilestones } });
      }
      // Refresh stats
      get().fetchProgressStats();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchProgressStats: async () => {
    try {
      const response = await api.get('/api/learning/progress/stats');
      set({ progressStats: response.data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchNews: async (topics) => {
    try {
      const response = await api.post('/api/learning/news', { topics });
      set({ news: response.data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  explainConcept: async (concept, context) => {
    try {
      const response = await api.post('/api/learning/explain', { concept, context });
      return response.data.explanation;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));
