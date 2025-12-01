import { create } from 'zustand';
import { api } from '../lib/api';

interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  technologies: string[];
  estimatedHours?: number;
}

interface UserProject {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'completed';
  progress: number;
  technologies: string[];
  createdAt: string;
}

interface ProjectsState {
  ideas: ProjectIdea[];
  userProjects: UserProject[];
  loading: boolean;
  error: string | null;
  fetchIdeas: (difficulty?: string, technologies?: string[]) => Promise<void>;
  fetchUserProjects: () => Promise<void>;
  generateIdeas: (skills: string[], interests: string[]) => Promise<void>;
  createProject: (ideaId: string) => Promise<void>;
  updateProjectProgress: (projectId: string, progress: number) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  ideas: [],
  userProjects: [],
  loading: false,
  error: null,

  fetchIdeas: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/projects/ideas');
      set({ ideas: response.data || [], loading: false });
    } catch {
      set({ ideas: [], loading: false, error: null });
    }
  },

  fetchUserProjects: async () => {
    set({ loading: true, error: null });
    try {
      await api.get('/api/projects/ideas');
      // Map ideas to user projects format for now
      set({ userProjects: [], loading: false });
    } catch {
      set({ userProjects: [], loading: false, error: null });
    }
  },

  generateIdeas: async (skills) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/api/projects/ideas', {
        difficulty: 'intermediate',
        technologies: skills.length > 0 ? skills.slice(0, 10) : ['JavaScript', 'React'],
        count: 5,
      });
      const data = response.data;
      set({ ideas: Array.isArray(data) ? data : [data], loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to generate ideas', loading: false });
    }
  },

  createProject: async (ideaId) => {
    try {
      // Generate architecture from idea
      const response = await api.post('/api/projects/architecture', { projectIdeaId: ideaId });
      const idea = get().ideas.find((i) => i.id === ideaId);
      if (idea) {
        const newProject: UserProject = {
          id: response.data.id || ideaId,
          name: idea.title,
          description: idea.description,
          status: 'planning',
          progress: 0,
          technologies: idea.technologies,
          createdAt: new Date().toISOString(),
        };
        set({ userProjects: [...get().userProjects, newProject] });
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create project' });
    }
  },

  updateProjectProgress: async (projectId, progress) => {
    const userProjects = get().userProjects.map((p) =>
      p.id === projectId ? { ...p, progress, status: progress === 100 ? 'completed' as const : 'in_progress' as const } : p
    );
    set({ userProjects });
  },
}));
