// services/topic-service.ts
import ApiService from './api-service';

interface FindTopicsParams {
    findby: string;
    max: number;
    recency?: number;
}

interface TopicAuthor {
    nickname: string;
    avatar_url: string;
    gender: string;
}

interface ApiTopic {
    uid: string;
    created_at: string;
    updated_at: string;
    user_uid: string;
    title: string;
    content: string;
    location_latitude: number;
    location_longitude: number;
    likes_count: number;
    participants_count: number;
    views_count: number;
    shares_count: number;
    expires_at: string;
    status: string;
    user: TopicAuthor;
    topic_images: string[];
    tags: string[];
    chat_id: string;
}

interface TopicApiResponse {
    code: number;
    message: string;
    data: {
        topics: ApiTopic[];
        score: number;
    };
}

class TopicService {
    // 获取话题列表
    async findTopics(params: FindTopicsParams): Promise<TopicApiResponse> {
        try {
            return await ApiService.post<TopicApiResponse>('/auth/topics/findby', params);
        } catch (error) {
            console.error('获取话题列表失败:', error);
            throw error;
        }
    }

    // 获取话题详情
    async getTopicById(id: string): Promise<any> {
        try {
            return await ApiService.get<any>(`/auth/topics/${id}`);
        } catch (error) {
            console.error('获取话题详情失败:', error);
            throw error;
        }
    }

    // 创建新话题
    async createTopic(topicData: any): Promise<any> {
        try {
            return await ApiService.post<any>('/auth/topics', topicData);
        } catch (error) {
            console.error('创建话题失败:', error);
            throw error;
        }
    }

    // 更新话题
    async updateTopic(id: string, topicData: any): Promise<any> {
        try {
            return await ApiService.put<any>(`/auth/topics/${id}`, topicData);
        } catch (error) {
            console.error('更新话题失败:', error);
            throw error;
        }
    }

    // 点赞话题
    async likeTopic(id: string): Promise<any> {
        try {
            return await ApiService.post<any>(`/auth/topics/${id}/like`, {});
        } catch (error) {
            console.error('点赞话题失败:', error);
            throw error;
        }
    }
}

export default new TopicService();