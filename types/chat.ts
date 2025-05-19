import { UserProfile } from './user';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: UserProfile;
  chatId: string;
  createdAt: string;
  readBy: string[];
  images?: string[];
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'; // 添加状态字段
}

export interface Chat {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: UserProfile[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  topicId?: string; // If chat is related to a topic
  isMuted?: boolean; // Added isMuted property
}

export interface CreateMessagePayload {
  content: string;
  chatId: string;
  images?: string[];
}

export interface CreateChatPayload {
  participants: string[];
  name?: string;
  isGroup: boolean;
  topicId?: string;
}