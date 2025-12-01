import { create } from 'zustand';
import { api } from '../lib/api';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  createdAt: string;
}

interface TimerSession {
  id: string;
  duration: number;
  startedAt: string;
  completedAt?: string;
}

interface ProductivityStats {
  tasksCompletedToday: number;
  totalFocusTime: number;
  pomodorosCompleted: number;
  streak: number;
}

interface ProductivityState {
  tasks: Task[];
  notes: Note[];
  activeTimer: TimerSession | null;
  stats: ProductivityStats | null;
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string) => Promise<void>;
  updateNote: (id: string, title: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  startTimer: (duration: number) => Promise<void>;
  stopTimer: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
}

export const useProductivityStore = create<ProductivityState>((set, get) => ({
  tasks: [],
  notes: [],
  activeTimer: null,
  stats: null,
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/productivity/tasks');
      set({ tasks: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createTask: async (task) => {
    try {
      const response = await api.post('/api/productivity/tasks', task);
      set({ tasks: [...get().tasks, response.data] });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateTask: async (id, updates) => {
    try {
      await api.put(`/api/productivity/tasks/${id}`, updates);
      const tasks = get().tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
      set({ tasks });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteTask: async (id) => {
    try {
      await api.delete(`/api/productivity/tasks/${id}`);
      set({ tasks: get().tasks.filter((t) => t.id !== id) });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchNotes: async () => {
    try {
      const response = await api.get('/api/productivity/notes');
      set({ notes: response.data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  createNote: async (title, content) => {
    try {
      const response = await api.post('/api/productivity/notes', { title, content });
      set({ notes: [...get().notes, response.data] });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateNote: async (id, title, content) => {
    try {
      await api.put(`/api/productivity/notes/${id}`, { title, content });
      const notes = get().notes.map((n) => (n.id === id ? { ...n, title, content } : n));
      set({ notes });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteNote: async (id) => {
    try {
      await api.delete(`/api/productivity/notes/${id}`);
      set({ notes: get().notes.filter((n) => n.id !== id) });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  startTimer: async (duration) => {
    try {
      const response = await api.post('/api/productivity/timer/start', { duration });
      set({ activeTimer: response.data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  stopTimer: async (id) => {
    try {
      await api.put(`/api/productivity/timer/${id}/stop`);
      set({ activeTimer: null });
      get().fetchStats();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchStats: async () => {
    // Stats endpoint doesn't exist, calculate from tasks
    const tasks = get().tasks;
    const completedToday = tasks.filter(t => t.status === 'done').length;
    set({ 
      stats: { 
        tasksCompletedToday: completedToday, 
        totalFocusTime: 0, 
        pomodorosCompleted: 0, 
        streak: 0 
      } 
    });
  },
}));
