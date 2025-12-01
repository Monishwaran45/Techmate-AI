import { create } from 'zustand';
import { api } from '../lib/api';

interface Question {
  id: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  content: string;
}

interface Session {
  id: string;
  type: 'dsa' | 'system_design' | 'behavioral';
  status: 'active' | 'completed';
  questions: Question[];
  score?: number;
  createdAt: string;
}

interface InterviewState {
  sessions: Session[];
  currentSession: Session | null;
  practiceQuestions: Question[];
  loading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  startSession: (type: 'dsa' | 'system_design' | 'behavioral') => Promise<Session>;
  getPracticeQuestions: (type?: string, difficulty?: string) => Promise<void>;
  submitAnswer: (sessionId: string, questionId: string, answer: string) => Promise<any>;
  completeSession: (sessionId: string) => Promise<any>;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  sessions: [],
  currentSession: null,
  practiceQuestions: [],
  loading: false,
  error: null,

  fetchSessions: async () => {
    set({ loading: true, error: null });
    try {
      // No sessions endpoint exists, just set empty
      set({ sessions: [], loading: false });
    } catch {
      set({ sessions: [], loading: false, error: null });
    }
  },

  startSession: async (type) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/api/interview/session', { type });
      const session = response.data;
      set({ currentSession: session, loading: false });
      return session;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to start session', loading: false });
      throw error;
    }
  },

  getPracticeQuestions: async (type, difficulty) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (difficulty) params.append('difficulty', difficulty);
      const response = await api.get(`/api/interview/practice?${params}`);
      set({ practiceQuestions: response.data || [], loading: false });
    } catch (error: any) {
      // Generate mock questions if API fails
      const mockQuestions: Question[] = [
        { id: '1', type: type || 'behavioral', difficulty: 'medium', content: 'Tell me about a challenging project you worked on.' },
        { id: '2', type: type || 'behavioral', difficulty: 'medium', content: 'How do you handle disagreements with team members?' },
        { id: '3', type: type || 'behavioral', difficulty: 'easy', content: 'What are your greatest strengths?' },
      ];
      set({ practiceQuestions: mockQuestions, loading: false, error: null });
    }
  },

  submitAnswer: async (sessionId, questionId, answer) => {
    try {
      const response = await api.post(`/api/interview/session/${sessionId}/answer`, {
        questionId,
        answer,
      });
      return response.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to submit answer' });
      throw error;
    }
  },

  completeSession: async (sessionId) => {
    try {
      const response = await api.post(`/api/interview/session/${sessionId}/complete`);
      set({ currentSession: null });
      return response.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to complete session' });
      throw error;
    }
  },
}));
