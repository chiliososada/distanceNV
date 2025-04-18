export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username?: string;
  password: string;
  displayName?: string;
}

// Alias for backward compatibility
export type RegisterCredentials = RegisterData;

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface User {
  id: string;
  type: 'person' | 'business';
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  // 添加新字段
  gender?: 'male' | 'female' | 'other';
  location?: Location;
  createdAt: string;
  updatedAt: string;
  followersCount: number;
  followingCount: number;
  topicsCount: number;
  likesCount: number;
  lastActiveAt: string;
  viewCount?: number;
  isOnline?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
}

export interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  clearError: () => void;
}