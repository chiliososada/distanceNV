// store/auth-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, RegisterData } from '@/types/auth';
import FirebaseAuthService from '@/services/firebase-auth-service';
import ApiService from '@/services/api-service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  isProfileComplete: boolean;
}

export interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  checkProfileCompleteness: () => boolean;
  checkSession: () => Promise<boolean>;
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
      isProfileComplete: false,

      initializeAuth: async () => {
        set({ isInitializing: true, error: null });
        try {
          // 尝试使用已保存的令牌检查会话状态
          const { token } = get();
          if (token) {
            ApiService.setToken(token);
            const isValid = await get().checkSession();

            if (isValid) {
              // 会话有效，无需重新登录
              set({
                isAuthenticated: true,
                isInitializing: false
              });
              return;
            }
          }

          // 会话无效或没有令牌
          set({
            isAuthenticated: false,
            isInitializing: false,
            user: null,
            token: null
          });
        } catch (error) {
          console.error("Auth初始化错误:", error);
          set({
            isAuthenticated: false,
            isInitializing: false,
            error: "认证初始化失败",
            user: null,
            token: null
          });
        }
      },

      checkSession: async () => {
        try {
          const response = await ApiService.checkSession();
          const isValid = response.code === 0 && response.data.uid !== '';

          if (!isValid) {
            // 会话无效，清除状态
            set({
              isAuthenticated: false,
              user: null,
              token: null
            });
          }

          return isValid;
        } catch (error) {
          console.error("会话检查失败:", error);
          // 发生错误视为会话无效
          set({
            isAuthenticated: false,
            user: null,
            token: null
          });
          return false;
        }
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          // 使用Firebase登录
          const firebaseResult = await FirebaseAuthService.loginUser(credentials.email, credentials.password);

          // 检查邮箱是否验证
          if (!firebaseResult.user.emailVerified) {
            set({
              isLoading: false,
              isAuthenticated: false,
              error: "请先验证邮箱再登录"
            });
            return;
          }

          // 使用获取的token调用后端API
          const token = firebaseResult.token;
          if (!token) {
            throw new Error("获取认证令牌失败");
          }

          // 调用后端API获取用户资料
          const userData = await ApiService.login(token);

          // 保存token和用户信息
          ApiService.setToken(token);

          // 检查资料是否完整
          const isProfileComplete = !!userData.displayName;

          set({
            user: userData,
            isAuthenticated: true,
            token: token,
            isProfileComplete,
            isLoading: false
          });
        } catch (error: any) {
          console.error("登录失败:", error);
          set({
            error: error.message || "登录失败，请检查您的邮箱和密码",
            isLoading: false,
            isAuthenticated: false
          });
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          // 注册用户
          await FirebaseAuthService.registerUser(data.email, data.password);

          // 注册成功但需要验证邮箱
          set({
            isLoading: false,
            isAuthenticated: false
          });
        } catch (error: any) {
          console.error("注册失败:", error);
          set({
            error: error.message || "注册失败，请重试",
            isLoading: false
          });
        }
      },

      logout: async () => {
        try {
          // 清理API服务中的token
          ApiService.clearToken();
        } catch (error) {
          console.error("登出错误:", error);
        } finally {
          // 清理所有认证状态
          set({
            user: null,
            isAuthenticated: false,
            token: null,
            isLoading: false,
            error: null,
            isProfileComplete: false
          });
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          // 调用API更新资料
          // 在真实应用中，您需要实现API服务中的updateProfile方法
          // const updatedUser = await ApiService.updateProfile(data);

          // 临时模拟API响应
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error("用户未登录");
          }

          const updatedUser = {
            ...currentUser,
            ...data,
            updatedAt: new Date().toISOString()
          };

          const isProfileComplete = !!updatedUser.displayName;

          set({
            user: updatedUser,
            isProfileComplete,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.message || "更新资料失败",
            isLoading: false
          });
        }
      },

      changePassword: async (oldPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          // 实现修改密码逻辑
          // 在真实应用中，您需要重新进行身份验证然后更改密码

          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || "修改密码失败",
            isLoading: false
          });
        }
      },

      sendPasswordResetEmail: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await FirebaseAuthService.sendPasswordReset(email);
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || "发送重置密码邮件失败",
            isLoading: false
          });
        }
      },

      resendVerificationEmail: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = FirebaseAuthService.getCurrentUser();
          if (!user) {
            throw new Error("用户未登录");
          }

          await FirebaseAuthService.sendVerificationEmail(user);
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || "发送验证邮件失败",
            isLoading: false
          });
        }
      },

      checkProfileCompleteness: () => {
        const { user } = get();
        return !!user && !!user.displayName;
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isProfileComplete: state.isProfileComplete
      }),
    }
  )
);