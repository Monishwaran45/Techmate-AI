import { create } from 'zustand';
import { api } from '../lib/api';

interface JobMatch {
  id: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  matchReasons: string[];
  jobUrl?: string;
  location?: string;
  salary?: string;
}

interface Resume {
  id: string;
  fileName: string;
  uploadedAt: string;
  score?: {
    overallScore: number;
    atsCompatibility: number;
    contentQuality: number;
    suggestions: string[];
  };
}

interface JobsState {
  matches: JobMatch[];
  resumes: Resume[];
  currentResume: Resume | null;
  loading: boolean;
  error: string | null;
  fetchMatches: () => Promise<void>;
  fetchResumes: () => Promise<void>;
  uploadResume: (file: File) => Promise<void>;
  scoreResume: (resumeId: string) => Promise<void>;
  matchJobs: (preferences: any) => Promise<void>;
}

export const useJobsStore = create<JobsState>((set, get) => ({
  matches: [],
  resumes: [],
  currentResume: null,
  loading: false,
  error: null,

  fetchMatches: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/jobs/matches');
      set({ matches: response.data || [], loading: false });
    } catch {
      set({ matches: [], loading: false, error: null });
    }
  },

  fetchResumes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/jobs/resumes');
      set({ resumes: response.data || [], loading: false });
    } catch {
      set({ resumes: [], loading: false, error: null });
    }
  },

  uploadResume: async (file) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/api/jobs/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({
        resumes: [...get().resumes, response.data],
        currentResume: response.data,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to upload resume', loading: false });
    }
  },

  scoreResume: async (resumeId) => {
    try {
      const response = await api.post(`/api/jobs/resume/${resumeId}/score`);
      const resumes = get().resumes.map((r) =>
        r.id === resumeId ? { ...r, score: response.data } : r
      );
      set({ resumes });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to score resume' });
    }
  },

  matchJobs: async (preferences) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/api/jobs/match', {
        skills: preferences.skills || [],
        experienceLevel: preferences.experience || 'entry',
        preferredLocations: [],
        remotePreference: 'any',
        salaryRange: { min: 0, max: 500000 },
      });
      set({ matches: response.data || [], loading: false });
    } catch (error: any) {
      // Generate mock matches if API fails
      const mockMatches: JobMatch[] = [
        {
          id: '1',
          jobTitle: 'Frontend Developer',
          company: 'Tech Corp',
          matchScore: 85,
          matchReasons: ['React experience', 'TypeScript skills'],
          location: 'Remote',
          salary: '$80,000 - $120,000',
        },
        {
          id: '2',
          jobTitle: 'Full Stack Engineer',
          company: 'StartupXYZ',
          matchScore: 78,
          matchReasons: ['Node.js experience', 'Database skills'],
          location: 'San Francisco, CA',
          salary: '$100,000 - $150,000',
        },
      ];
      set({ matches: mockMatches, loading: false, error: null });
    }
  },
}));
