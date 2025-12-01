import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@techmate/shared-types';
import { api } from '../lib/api';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'developer' | 'professional';
}

interface LoginResult {
  requires2FA?: boolean;
}

interface UpdateProfileData {
  name?: string;
  skills?: string[];
  goals?: string[];
  experience?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        set({ token });
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          delete api.defaults.headers.common['Authorization'];
        }
      },
      login: async (email, password, twoFactorCode) => {
        try {
          const response = await api.post('/api/auth/login', {
            email,
            password,
            twoFactorCode,
          });

          if (response.data.requires2FA) {
            return { requires2FA: true };
          }

          const { accessToken, user } = response.data;
          get().setToken(accessToken);
          set({ user });
          return {};
        } catch (error: any) {
          throw new Error(error.response?.data?.error?.message || 'Login failed');
        }
      },
      register: async (data) => {
        try {
          const response = await api.post('/api/auth/register', data);
          const { accessToken, user } = response.data;
          get().setToken(accessToken);
          set({ user });
        } catch (error: any) {
          throw new Error(error.response?.data?.error?.message || 'Registration failed');
        }
      },
      updateProfile: async (data) => {
        try {
          const response = await api.put('/api/auth/profile', data);
          const currentUser = get().user;
          if (currentUser) {
            set({ user: { ...currentUser, profile: response.data } });
          }
        } catch (error: any) {
          throw new Error(error.response?.data?.error?.message || 'Profile update failed');
        }
      },
      fetchProfile: async () => {
        try {
          const response = await api.get('/api/auth/me');
          set({ user: response.data });
        } catch (error: any) {
          throw new Error(error.response?.data?.error?.message || 'Failed to fetch profile');
        }
      },
      logout: () => {
        get().setToken(null);
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
