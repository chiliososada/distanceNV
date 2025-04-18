// services/api-service.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

class ApiService {
    private apiBaseURL = 'https://192.168.0.9:52340';
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
            params
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
        const config = this.addAuthHeader();
        const url = this.getUrl(endpoint);

        try {
            const response: AxiosResponse<T> = await axios.post(url, data, config);
            return response.data;
        } catch (error: any) {
            this.handleApiError(error);
            throw error;
        }
    }

    // 登录API，使用Firebase Token获取用户资料
    async login(token: string): Promise<any> {
        // 先设置token
        this.setToken(token);

        try {
            return await this.post('/login');
        } catch (error) {
            console.error('登录API调用失败:', error);
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