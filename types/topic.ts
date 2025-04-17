import { User } from './auth';

export interface Topic {
  id: string;
  title: string;
  content: string;
  author: User;
  authorId: string;
  images: string[];
  tags: string[];
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  distance?: number; // Distance from current user
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
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

export interface TopicFilter {
  search?: string;
  tags?: string[];
  distance?: number;
  sort?: 'recent' | 'popular' | 'distance';
}