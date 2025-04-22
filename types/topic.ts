
import { User } from './auth';

// 添加API话题类型
export interface ApiTopic {
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
  user: {
    nickname: string;
    avatar_url: string;
    gender: string;
  };
  topic_images: string[];
  tags: string[];
  chat_id: string;
}

// 保留原有Topic接口，但确保能兼容API数据
export interface Topic {
  id: string; // 对应API中的uid
  title: string;
  content: string;
  author: User;
  authorId: string; // 对应API中的user_uid
  images: string[]; // 转换后的Firebase存储URL
  tags: string[];
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  distance?: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number; // 使用API中的participants_count
  isLiked: boolean;
  chatId?: string; // 新增，对应API中的chat_id
}

// 其他接口保持不变
export interface TopicFilter {
  search?: string;
  tags?: string[];
  distance?: number;
  sort?: 'recent' | 'popular' | 'distance';
}

export interface CreateTopicPayload {
  title: string;
  content: string;
  images: string[];
  tags: string[];
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  expiresAt?: string;
}