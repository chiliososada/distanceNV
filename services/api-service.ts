// services/api-service.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

axios.defaults.withCredentials = true;

interface LoginResponseData {
    session: {
        csrf_token: string;
        chat_token: string;
        uid: string;
        display_name: string;
        photo_url: string;
        email: string;
        gender: string;
        bio: string;
        chat_url: string
    }
    chats: { chat_room_id: string, expires_at: string }[]
}

interface LoginResponse {
    code: number;
    message: string;
    data: LoginResponseData
}
// 更新个人资料请求接口
interface UpdateProfileRequest {
    email: string;
    nickname?: string;
    bio?: string;
    gender?: 'male' | 'female' | 'other';
    birth_date?: string;
    language?: string;
    privacy_level?: 'public' | 'friends' | 'private';
    location_sharing?: boolean;
    photo_enabled?: boolean;
    notification_enabled?: boolean;
    avatar_url?: string;
}



class ApiService {
    private apiBaseURL = process.env.EXPO_PUBLIC_API_URL
    private apiVersion = 'v1';
    private token: string | null = null;

    // 设置认证令牌
    setToken(token: string) {
        this.token = token;
    }

    // 清除认证令牌
    clearToken() {
        this.token = null;
    }

    // 获取完整API URL
    private getUrl(endpoint: string): string {
        return `${this.apiBaseURL}/api/${this.apiVersion}${endpoint}`;
    }

    // 添加身份验证头
    private addAuthHeader(config: AxiosRequestConfig = {}): AxiosRequestConfig {
        if (!this.token) {
            return config;
        }

        return {
            ...config,
            headers: {
                ...config.headers,
                Authorization: `Bearer ${this.token}`
            }
        };
    }

    // 通用GET请求方法
    async get<T>(endpoint: string, params?: any): Promise<T> {
        const config = this.addAuthHeader({
            params,
            timeout: 10000 // 10秒超时
        });
        const url = this.getUrl(endpoint);

        try {
            const response: AxiosResponse<T> = await axios.get(url, config);
            return response.data;
        } catch (error: any) {
            this.handleApiError(error);
            throw error;
        }
    }

    // 通用POST请求方法
    async post<T>(endpoint: string, data?: any): Promise<T> {
        const config = this.addAuthHeader({
            timeout: 10000 // 10秒超时
        });
        const url = this.getUrl(endpoint);

        try {
            const response: AxiosResponse<T> = await axios.post(url, data, config);
            return response.data;
        } catch (error: any) {
            this.handleApiError(error);
            throw error;
        }
    }

    async put<T>(endpoint: string, data?: any): Promise<T> {
        const config = this.addAuthHeader({
            timeout: 10000 // 10秒超时
        });
        const url = this.getUrl(endpoint);

        try {
            const response: AxiosResponse<T> = await axios.put(url, data, config);
            return response.data;
        } catch (error: any) {
            this.handleApiError(error);
            throw error;
        }
    }

    // 登录API，使用Firebase Token获取用户资料
    async login(token: string): Promise<LoginResponseData> {
        // 先设置token
        this.setToken(token);

        try {
            // 发送请求获取响应，指定泛型类型
            const response = await this.post<LoginResponse>('/login', { id_token: token });

            // 检查响应是否成功
            if (response.code !== 0 || response.message !== "success") {
                throw new Error(response.message || "登录失败");
            }

            // 返回用户数据
            return response.data;
        } catch (error) {
            console.error('登录API调用失败:', error);
            throw error;
        }
    }
    async updateProfile(profileData: UpdateProfileRequest): Promise<any> {
        try {
            return await this.put<any>('/auth/users/updateprofile', profileData);
        } catch (error) {
            console.error('更新个人资料失败:', error);
            throw error;
        }
    }



    // 加入聊天室的HTTP请求
    async joinChat(topicUid: string, chatRoomUid: string): Promise<any> {
        try {
            const config = this.addAuthHeader({
                timeout: 10000
            });

            const url = this.getUrl('/auth/chats/join');
            const data = {
                topic_uid: topicUid,
                chat_room_uid: chatRoomUid
            };

            const response: AxiosResponse<any> = await axios.post(url, data, config);
            return response.data;
        } catch (error: any) {
            this.handleApiError(error);
            throw error;
        }
    }





    // 检查会话状态
    async checkSession(): Promise<{ code: number, data: { uid: string } }> {
        try {
            return await this.get('/auth/checksession');
        } catch (error) {
            console.error('检查会话状态失败:', error);
            throw error;
        }
    }

    // API错误处理
    private handleApiError(error: any): void {
        if (axios.isAxiosError(error)) {
            // 处理网络错误
            if (!error.response) {
                console.error('网络错误:', error.message);
                throw new Error('网络连接错误，请检查您的网络连接');
            }

            // 处理HTTP错误
            const status = error.response.status;
            const data = error.response.data;

            if (status === 401) {
                console.error('认证失败:', data);
                throw new Error('认证过期，请重新登录');
            } else if (status === 403) {
                console.error('权限不足:', data);
                throw new Error('权限不足，无法执行此操作');
            } else {
                console.error(`API错误 (${status}):`, data);
                throw new Error(data?.message || '服务器错误，请稍后再试');
            }
        } else {
            console.error('未知错误:', error);
            throw error;
        }
    }
}

export default new ApiService();