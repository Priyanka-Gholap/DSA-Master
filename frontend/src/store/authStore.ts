import { create } from 'zustand';
import api from '../services/api';
import { User, AuthResponse, UserUpdateResponse } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  checkAuth: () => Promise<void>;
  login: (credentials: any) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<User>;
}

// Safely retrieve cached user details from localStorage on client boot
const getCachedUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem('dsa_master_user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const getCachedIsAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('dsa_master_logged_in') === 'true';
};

export const useAuthStore = create<AuthState>((set) => {
  // Listen for the unauthorized custom event to clear state
  if (typeof window !== 'undefined') {
    window.addEventListener('auth-unauthorized', () => {
      localStorage.removeItem('dsa_master_logged_in');
      localStorage.removeItem('dsa_master_user');
      localStorage.removeItem('dsa_master_token');
      set({ user: null, isAuthenticated: false, error: 'Session expired' });
    });
  }

  return {
    user: getCachedUser(),
    isAuthenticated: getCachedIsAuthenticated(),
    isLoading: getCachedIsAuthenticated() ? false : true,
    error: null,

    setUser: (user) => {
      if (typeof window !== 'undefined') {
        if (user) {
          localStorage.setItem('dsa_master_logged_in', 'true');
          localStorage.setItem('dsa_master_user', JSON.stringify(user));
        } else {
          localStorage.removeItem('dsa_master_logged_in');
          localStorage.removeItem('dsa_master_user');
          localStorage.removeItem('dsa_master_token');
        }
      }
      set({ user, isAuthenticated: !!user });
    },
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    checkAuth: async () => {
      const isAlreadyCached = typeof window !== 'undefined' && localStorage.getItem('dsa_master_logged_in') === 'true';
      if (!isAlreadyCached) {
        set({ isLoading: true });
      }
      set({ error: null });
      try {
        const response = await api.get<{ status: string; data: { user: User } }>('/auth/me');
        if (response.data?.data?.user) {
          const user = response.data.data.user;
          if (typeof window !== 'undefined') {
            localStorage.setItem('dsa_master_logged_in', 'true');
            localStorage.setItem('dsa_master_user', JSON.stringify(user));
          }
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('dsa_master_logged_in');
            localStorage.removeItem('dsa_master_user');
            localStorage.removeItem('dsa_master_token');
          }
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } catch (error: any) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dsa_master_logged_in');
          localStorage.removeItem('dsa_master_user');
          localStorage.removeItem('dsa_master_token');
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    },

    login: async (credentials) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        const user = response.data.data.user;
        const token = response.data.data.token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('dsa_master_logged_in', 'true');
          localStorage.setItem('dsa_master_user', JSON.stringify(user));
          if (token) {
            localStorage.setItem('dsa_master_token', token);
          }
        }
        set({ user, isAuthenticated: true, isLoading: false });
        return user;
      } catch (error: any) {
        const message = error.response?.data?.message || 'Login failed';
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    register: async (userData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post<AuthResponse>('/auth/register', userData);
        const user = response.data.data.user;
        const token = response.data.data.token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('dsa_master_logged_in', 'true');
          localStorage.setItem('dsa_master_user', JSON.stringify(user));
          if (token) {
            localStorage.setItem('dsa_master_token', token);
          }
        }
        set({ user, isAuthenticated: true, isLoading: false });
        return user;
      } catch (error: any) {
        const message = error.response?.data?.message || 'Registration failed';
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },

    logout: async () => {
      set({ isLoading: true });
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // Even if request fails, clear local session state
      } finally {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dsa_master_logged_in');
          localStorage.removeItem('dsa_master_user');
          localStorage.removeItem('dsa_master_token');
        }
        set({ user: null, isAuthenticated: false, isLoading: false, error: null });
      }
    },

    updateProfile: async (profileData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.put<UserUpdateResponse>('/user/profile', profileData);
        const user = response.data.data.user;
        if (typeof window !== 'undefined') {
          localStorage.setItem('dsa_master_user', JSON.stringify(user));
        }
        set({ user, isLoading: false });
        return user;
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to update profile';
        set({ isLoading: false, error: message });
        throw new Error(message);
      }
    },
  };
});
export default useAuthStore;
