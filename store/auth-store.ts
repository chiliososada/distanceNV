import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, RegisterData } from '@/types/auth';

// Mock user for demo
const mockUser: User = {
  id: '1',
  type: 'person',
  email: 'john@example.com',
  username: 'johndoe',
  displayName: 'John Doe',
  bio: 'Software developer and hiking enthusiast',
  avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    address: 'San Francisco, CA',
  },
  createdAt: new Date(2023, 1, 15).toISOString(),
  updatedAt: new Date(2023, 5, 20).toISOString(),
  followersCount: 245,
  followingCount: 178,
  topicsCount: 32,
  likesCount: 423,
  lastActiveAt: new Date().toISOString(),
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

export interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isInitializing: true,
      isLoading: false,
      error: null,
      token: null,

      initializeAuth: async () => {
        try {
          // In a real app, we would validate the token with the server
          // For demo, we'll just check if we have a user
          const state = get();
          const isValid = !!state.user && !!state.token;
          
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set({ 
            isAuthenticated: isValid,
            isInitializing: false
          });
        } catch (error) {
          console.error("Auth initialization error:", error);
          set({ 
            isAuthenticated: false, 
            isInitializing: false,
            error: "Failed to initialize authentication"
          });
        }
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // In a real app, we would validate credentials with the server
          if (credentials.email === 'john@example.com' && credentials.password === 'password') {
            set({ 
              user: mockUser, 
              isAuthenticated: true,
              token: 'mock-jwt-token',
              isLoading: false
            });
          } else {
            set({ error: 'Invalid email or password', isLoading: false });
          }
        } catch (error) {
          set({ error: 'Login failed. Please try again.', isLoading: false });
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // In a real app, we would send registration data to the server
          const newUser: User = {
            ...mockUser,
            email: data.email,
            username: data.username,
            displayName: data.displayName,
          };
          
          set({ 
            user: newUser, 
            isAuthenticated: true,
            token: 'mock-jwt-token',
            isLoading: false
          });
        } catch (error) {
          set({ error: 'Registration failed. Please try again.', isLoading: false });
        }
      },

      logout: () => {
        // Clear all auth state
        set({ 
          user: null, 
          isAuthenticated: false,
          token: null,
          isLoading: false,
          error: null
        });
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const currentUser = get().user;
          
          if (!currentUser) {
            set({ error: 'Not authenticated', isLoading: false });
            return;
          }
          
          const updatedUser = {
            ...currentUser,
            ...data,
            updatedAt: new Date().toISOString(),
          };
          
          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to update profile. Please try again.', isLoading: false });
        }
      },

      changePassword: async (oldPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // In a real app, we would validate the old password and update to the new one
          if (oldPassword !== 'password') {
            set({ error: 'Current password is incorrect', isLoading: false });
            return;
          }
          
          // Password changed successfully
          set({ isLoading: false });
        } catch (error) {
          set({ error: 'Failed to change password. Please try again.', isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);