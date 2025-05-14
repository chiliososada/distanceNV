// store/chat-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chat, CreateChatPayload, CreateMessagePayload, Message } from '@/types/chat';
import { useAuthStore } from './auth-store';
import { ChatMessage } from '@/services/websocket-service';

// Mock chats for demo
const mockChats: Chat[] = [
  {
    id: '1',
    isGroup: false,
    participants: [
      {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      {
        id: '2',
        type: 'person',
        email: 'jane@example.com',
        username: 'janesmith',
        displayName: 'Jane Smith',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        createdAt: new Date(2023, 2, 10).toISOString(),
        updatedAt: new Date(2023, 6, 5).toISOString(),
        followersCount: 532,
        followingCount: 215,
        topicsCount: 47,
      },
    ],
    createdAt: new Date(2023, 6, 10).toISOString(),
    updatedAt: new Date(2023, 6, 15).toISOString(),
    unreadCount: 2,
    isMuted: false,
    lastMessage: {
      id: '3',
      content: "I'm doing well. Did you see that new coffee shop downtown?",
      senderId: '1',
      sender: {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      chatId: '1',
      createdAt: new Date(2023, 6, 15, 10, 35).toISOString(),
      readBy: ['1'],
    }
  },
  {
    id: '2',
    name: 'Hiking Enthusiasts',
    isGroup: true,
    participants: [
      {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      {
        id: '2',
        type: 'person',
        email: 'jane@example.com',
        username: 'janesmith',
        displayName: 'Jane Smith',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        createdAt: new Date(2023, 2, 10).toISOString(),
        updatedAt: new Date(2023, 6, 5).toISOString(),
        followersCount: 532,
        followingCount: 215,
        topicsCount: 47,
      },
      {
        id: '3',
        type: 'person',
        email: 'mike@example.com',
        username: 'mikeross',
        displayName: 'Mike Ross',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        createdAt: new Date(2023, 3, 5).toISOString(),
        updatedAt: new Date(2023, 6, 10).toISOString(),
        followersCount: 320,
        followingCount: 250,
        topicsCount: 28,
      }
    ],
    topicId: '2',
    createdAt: new Date(2023, 6, 14).toISOString(),
    updatedAt: new Date(2023, 6, 15).toISOString(),
    unreadCount: 5,
    isMuted: true,
    lastMessage: {
      id: '3',
      content: "I was thinking about the Eagle Peak trail. It's supposed to be beautiful this time of year.",
      senderId: '1',
      sender: {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      chatId: '2',
      createdAt: new Date(2023, 6, 14, 15, 10).toISOString(),
      readBy: ['1'],
      images: ['https://images.unsplash.com/photo-1551632811-561732d1e306'],
    }
  },
  {
    id: '3',
    isGroup: false,
    participants: [
      {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      {
        id: '3',
        type: 'person',
        email: 'mike@example.com',
        username: 'mikeross',
        displayName: 'Mike Ross',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        createdAt: new Date(2023, 3, 5).toISOString(),
        updatedAt: new Date(2023, 6, 10).toISOString(),
        followersCount: 320,
        followingCount: 250,
        topicsCount: 28,
      }
    ],
    createdAt: new Date(2023, 5, 20).toISOString(),
    updatedAt: new Date(2023, 6, 12).toISOString(),
    unreadCount: 1,
    isMuted: false,
    lastMessage: {
      id: '2',
      content: "Let's meet up for lunch next week. I have some exciting news to share!",
      senderId: '3',
      sender: {
        id: '3',
        type: 'person',
        email: 'mike@example.com',
        username: 'mikeross',
        displayName: 'Mike Ross',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        createdAt: new Date(2023, 3, 5).toISOString(),
        updatedAt: new Date(2023, 6, 10).toISOString(),
        followersCount: 320,
        followingCount: 250,
        topicsCount: 28,
      },
      chatId: '3',
      createdAt: new Date(2023, 6, 12, 13, 45).toISOString(),
      readBy: ['3'],
    }
  },
  {
    id: '4',
    isGroup: false,
    participants: [
      {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      {
        id: '4',
        type: 'business',
        email: 'info@coffeeshop.com',
        username: 'citycoffee',
        displayName: 'City Coffee Shop',
        avatar: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8',
        createdAt: new Date(2023, 1, 10).toISOString(),
        updatedAt: new Date(2023, 5, 15).toISOString(),
        followersCount: 1245,
        followingCount: 58,
        topicsCount: 12,
      }
    ],
    createdAt: new Date(2023, 4, 5).toISOString(),
    updatedAt: new Date(2023, 6, 10).toISOString(),
    unreadCount: 3,
    isMuted: false,
    lastMessage: {
      id: '1',
      content: "We're having a special promotion this weekend! 20% off all drinks.",
      senderId: '4',
      sender: {
        id: '4',
        type: 'business',
        email: 'info@coffeeshop.com',
        username: 'citycoffee',
        displayName: 'City Coffee Shop',
        avatar: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8',
        createdAt: new Date(2023, 1, 10).toISOString(),
        updatedAt: new Date(2023, 5, 15).toISOString(),
        followersCount: 1245,
        followingCount: 58,
        topicsCount: 12,
      },
      chatId: '4',
      createdAt: new Date(2023, 6, 10, 9, 0).toISOString(),
      readBy: ['4'],
      images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93'],
    }
  },
  {
    id: '5',
    name: 'Travel Buddies',
    isGroup: true,
    participants: [
      {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      {
        id: '2',
        type: 'person',
        email: 'jane@example.com',
        username: 'janesmith',
        displayName: 'Jane Smith',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        createdAt: new Date(2023, 2, 10).toISOString(),
        updatedAt: new Date(2023, 6, 5).toISOString(),
        followersCount: 532,
        followingCount: 215,
        topicsCount: 47,
      },
      {
        id: '3',
        type: 'person',
        email: 'mike@example.com',
        username: 'mikeross',
        displayName: 'Mike Ross',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        createdAt: new Date(2023, 3, 5).toISOString(),
        updatedAt: new Date(2023, 6, 10).toISOString(),
        followersCount: 320,
        followingCount: 250,
        topicsCount: 28,
      },
      {
        id: '5',
        type: 'person',
        email: 'sarah@example.com',
        username: 'sarahlee',
        displayName: 'Sarah Lee',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
        createdAt: new Date(2023, 2, 20).toISOString(),
        updatedAt: new Date(2023, 5, 25).toISOString(),
        followersCount: 420,
        followingCount: 310,
        topicsCount: 15,
      }
    ],
    topicId: '5',
    createdAt: new Date(2023, 5, 1).toISOString(),
    updatedAt: new Date(2023, 6, 8).toISOString(),
    unreadCount: 12,
    isMuted: false,
    lastMessage: {
      id: '4',
      content: "Has anyone been to Bali recently? I'm planning a trip next month and need some recommendations.",
      senderId: '5',
      sender: {
        id: '5',
        type: 'person',
        email: 'sarah@example.com',
        username: 'sarahlee',
        displayName: 'Sarah Lee',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
        createdAt: new Date(2023, 2, 20).toISOString(),
        updatedAt: new Date(2023, 5, 25).toISOString(),
        followersCount: 420,
        followingCount: 310,
        topicsCount: 15,
      },
      chatId: '5',
      createdAt: new Date(2023, 6, 8, 18, 22).toISOString(),
      readBy: ['5'],
    }
  },
  {
    id: '6',
    isGroup: false,
    participants: [
      {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      {
        id: '6',
        type: 'business',
        email: 'support@techstore.com',
        username: 'techstore',
        displayName: 'Tech Store',
        avatar: 'https://images.unsplash.com/photo-1563770660941-10a63607957a',
        createdAt: new Date(2023, 0, 5).toISOString(),
        updatedAt: new Date(2023, 4, 10).toISOString(),
        followersCount: 2450,
        followingCount: 120,
        topicsCount: 45,
      }
    ],
    createdAt: new Date(2023, 3, 15).toISOString(),
    updatedAt: new Date(2023, 6, 5).toISOString(),
    unreadCount: 0,
    isMuted: true,
    lastMessage: {
      id: '5',
      content: "Your order #45678 has been shipped and will arrive in 2-3 business days.",
      senderId: '6',
      sender: {
        id: '6',
        type: 'business',
        email: 'support@techstore.com',
        username: 'techstore',
        displayName: 'Tech Store',
        avatar: 'https://images.unsplash.com/photo-1563770660941-10a63607957a',
        createdAt: new Date(2023, 0, 5).toISOString(),
        updatedAt: new Date(2023, 4, 10).toISOString(),
        followersCount: 2450,
        followingCount: 120,
        topicsCount: 45,
      },
      chatId: '6',
      createdAt: new Date(2023, 6, 5, 14, 30).toISOString(),
      readBy: ['1', '6'],
    }
  }
];

// Mock messages for demo
const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '1',
      content: "Hey, how's it going?",
      senderId: '1',
      sender: {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      chatId: '1',
      createdAt: new Date(2023, 6, 15, 10, 30).toISOString(),
      readBy: ['1'],
    },
    {
      id: '2',
      content: "I'm good, thanks! How about you?",
      senderId: '2',
      sender: {
        id: '2',
        type: 'person',
        email: 'jane@example.com',
        username: 'janesmith',
        displayName: 'Jane Smith',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        createdAt: new Date(2023, 2, 10).toISOString(),
        updatedAt: new Date(2023, 6, 5).toISOString(),
        followersCount: 532,
        followingCount: 215,
        topicsCount: 47,
      },
      chatId: '1',
      createdAt: new Date(2023, 6, 15, 10, 32).toISOString(),
      readBy: ['2'],
    },
    {
      id: '3',
      content: "I'm doing well. Did you see that new coffee shop downtown?",
      senderId: '1',
      sender: {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      chatId: '1',
      createdAt: new Date(2023, 6, 15, 10, 35).toISOString(),
      readBy: ['1'],
    },
  ],
  '2': [
    {
      id: '1',
      content: "Hey everyone! Who's up for a hike this weekend?",
      senderId: '1',
      sender: {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      chatId: '2',
      createdAt: new Date(2023, 6, 14, 15, 0).toISOString(),
      readBy: ['1', '2'],
    },
    {
      id: '2',
      content: "I'm in! What trail are you thinking?",
      senderId: '2',
      sender: {
        id: '2',
        type: 'person',
        email: 'jane@example.com',
        username: 'janesmith',
        displayName: 'Jane Smith',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        createdAt: new Date(2023, 2, 10).toISOString(),
        updatedAt: new Date(2023, 6, 5).toISOString(),
        followersCount: 532,
        followingCount: 215,
        topicsCount: 47,
      },
      chatId: '2',
      createdAt: new Date(2023, 6, 14, 15, 5).toISOString(),
      readBy: ['1', '2'],
    },
    {
      id: '3',
      content: "I was thinking about the Eagle Peak trail. It's supposed to be beautiful this time of year.",
      senderId: '1',
      sender: {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      chatId: '2',
      createdAt: new Date(2023, 6, 14, 15, 10).toISOString(),
      readBy: ['1'],
      images: ['https://images.unsplash.com/photo-1551632811-561732d1e306'],
    },
    {
      id: '4',
      content: "Sounds great! I've been wanting to try that trail. What time were you thinking?",
      senderId: '3',
      sender: {
        id: '3',
        type: 'person',
        email: 'mike@example.com',
        username: 'mikeross',
        displayName: 'Mike Ross',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        createdAt: new Date(2023, 3, 5).toISOString(),
        updatedAt: new Date(2023, 6, 10).toISOString(),
        followersCount: 320,
        followingCount: 250,
        topicsCount: 28,
      },
      chatId: '2',
      createdAt: new Date(2023, 6, 14, 15, 15).toISOString(),
      readBy: ['3'],
    },
    {
      id: '5',
      content: "How about 9 AM on Saturday? We could meet at the trailhead.",
      senderId: '1',
      sender: {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      chatId: '2',
      createdAt: new Date(2023, 6, 14, 15, 20).toISOString(),
      readBy: ['1'],
    }
  ],
  '3': [
    {
      id: '1',
      content: "Hey Mike, how have you been?",
      senderId: '1',
      sender: {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      chatId: '3',
      createdAt: new Date(2023, 6, 12, 13, 30).toISOString(),
      readBy: ['1'],
    },
    {
      id: '2',
      content: "Let's meet up for lunch next week. I have some exciting news to share!",
      senderId: '3',
      sender: {
        id: '3',
        type: 'person',
        email: 'mike@example.com',
        username: 'mikeross',
        displayName: 'Mike Ross',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        createdAt: new Date(2023, 3, 5).toISOString(),
        updatedAt: new Date(2023, 6, 10).toISOString(),
        followersCount: 320,
        followingCount: 250,
        topicsCount: 28,
      },
      chatId: '3',
      createdAt: new Date(2023, 6, 12, 13, 45).toISOString(),
      readBy: ['3'],
    }
  ],
  '4': [
    {
      id: '1',
      content: "We're having a special promotion this weekend! 20% off all drinks.",
      senderId: '4',
      sender: {
        id: '4',
        type: 'business',
        email: 'info@coffeeshop.com',
        username: 'citycoffee',
        displayName: 'City Coffee Shop',
        avatar: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8',
        createdAt: new Date(2023, 1, 10).toISOString(),
        updatedAt: new Date(2023, 5, 15).toISOString(),
        followersCount: 1245,
        followingCount: 58,
        topicsCount: 12,
      },
      chatId: '4',
      createdAt: new Date(2023, 6, 10, 9, 0).toISOString(),
      readBy: ['4'],
      images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93'],
    },
    {
      id: '2',
      content: "That sounds great! What hours are you open this weekend?",
      senderId: '1',
      sender: {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      chatId: '4',
      createdAt: new Date(2023, 6, 10, 10, 15).toISOString(),
      readBy: ['1'],
    },
    {
      id: '3',
      content: "We're open from 7 AM to 9 PM on Saturday and 8 AM to 7 PM on Sunday. Hope to see you there!",
      senderId: '4',
      sender: {
        id: '4',
        type: 'business',
        email: 'info@coffeeshop.com',
        username: 'citycoffee',
        displayName: 'City Coffee Shop',
        avatar: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8',
        createdAt: new Date(2023, 1, 10).toISOString(),
        updatedAt: new Date(2023, 5, 15).toISOString(),
        followersCount: 1245,
        followingCount: 58,
        topicsCount: 12,
      },
      chatId: '4',
      createdAt: new Date(2023, 6, 10, 11, 0).toISOString(),
      readBy: ['4'],
    }
  ],
  '5': [
    {
      id: '1',
      content: "Hi everyone! I created this group for us to plan our upcoming trips together.",
      senderId: '1',
      sender: {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      chatId: '5',
      createdAt: new Date(2023, 5, 1, 12, 0).toISOString(),
      readBy: ['1', '2', '3'],
    },
    {
      id: '2',
      content: "Great idea! I've been wanting to plan a trip to Europe this summer.",
      senderId: '2',
      sender: {
        id: '2',
        type: 'person',
        email: 'jane@example.com',
        username: 'janesmith',
        displayName: 'Jane Smith',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        createdAt: new Date(2023, 2, 10).toISOString(),
        updatedAt: new Date(2023, 6, 5).toISOString(),
        followersCount: 532,
        followingCount: 215,
        topicsCount: 47,
      },
      chatId: '5',
      createdAt: new Date(2023, 5, 1, 12, 15).toISOString(),
      readBy: ['1', '2', '3'],
    },
    {
      id: '3',
      content: "I'm thinking about Japan in the fall. Anyone interested?",
      senderId: '3',
      sender: {
        id: '3',
        type: 'person',
        email: 'mike@example.com',
        username: 'mikeross',
        displayName: 'Mike Ross',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        createdAt: new Date(2023, 3, 5).toISOString(),
        updatedAt: new Date(2023, 6, 10).toISOString(),
        followersCount: 320,
        followingCount: 250,
        topicsCount: 28,
      },
      chatId: '5',
      createdAt: new Date(2023, 5, 1, 13, 0).toISOString(),
      readBy: ['1', '2', '3'],
    },
    {
      id: '4',
      content: "Has anyone been to Bali recently? I'm planning a trip next month and need some recommendations.",
      senderId: '5',
      sender: {
        id: '5',
        type: 'person',
        email: 'sarah@example.com',
        username: 'sarahlee',
        displayName: 'Sarah Lee',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
        createdAt: new Date(2023, 2, 20).toISOString(),
        updatedAt: new Date(2023, 5, 25).toISOString(),
        followersCount: 420,
        followingCount: 310,
        topicsCount: 15,
      },
      chatId: '5',
      createdAt: new Date(2023, 6, 8, 18, 22).toISOString(),
      readBy: ['5'],
    }
  ],
  '6': [
    {
      id: '1',
      content: "Thank you for your recent purchase! Your order #45678 has been confirmed.",
      senderId: '6',
      sender: {
        id: '6',
        type: 'business',
        email: 'support@techstore.com',
        username: 'techstore',
        displayName: 'Tech Store',
        avatar: 'https://images.unsplash.com/photo-1563770660941-10a63607957a',
        createdAt: new Date(2023, 0, 5).toISOString(),
        updatedAt: new Date(2023, 4, 10).toISOString(),
        followersCount: 2450,
        followingCount: 120,
        topicsCount: 45,
      },
      chatId: '6',
      createdAt: new Date(2023, 6, 1, 10, 0).toISOString(),
      readBy: ['1', '6'],
    },
    {
      id: '2',
      content: "When can I expect my order to be shipped?",
      senderId: '1',
      sender: {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      chatId: '6',
      createdAt: new Date(2023, 6, 2, 9, 30).toISOString(),
      readBy: ['1', '6'],
    },
    {
      id: '3',
      content: "We're processing your order and it should be shipped within 1-2 business days. We'll send you a notification once it's on the way.",
      senderId: '6',
      sender: {
        id: '6',
        type: 'business',
        email: 'support@techstore.com',
        username: 'techstore',
        displayName: 'Tech Store',
        avatar: 'https://images.unsplash.com/photo-1563770660941-10a63607957a',
        createdAt: new Date(2023, 0, 5).toISOString(),
        updatedAt: new Date(2023, 4, 10).toISOString(),
        followersCount: 2450,
        followingCount: 120,
        topicsCount: 45,
      },
      chatId: '6',
      createdAt: new Date(2023, 6, 2, 11, 15).toISOString(),
      readBy: ['1', '6'],
    },
    {
      id: '4',
      content: "Thanks for the update!",
      senderId: '1',
      sender: {
        id: '1',
        type: 'person',
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
        createdAt: new Date(2023, 1, 15).toISOString(),
        updatedAt: new Date(2023, 5, 20).toISOString(),
        followersCount: 245,
        followingCount: 178,
        topicsCount: 32,
      },
      chatId: '6',
      createdAt: new Date(2023, 6, 2, 11, 30).toISOString(),
      readBy: ['1', '6'],
    },
    {
      id: '5',
      content: "Your order #45678 has been shipped and will arrive in 2-3 business days.",
      senderId: '6',
      sender: {
        id: '6',
        type: 'business',
        email: 'support@techstore.com',
        username: 'techstore',
        displayName: 'Tech Store',
        avatar: 'https://images.unsplash.com/photo-1563770660941-10a63607957a',
        createdAt: new Date(2023, 0, 5).toISOString(),
        updatedAt: new Date(2023, 4, 10).toISOString(),
        followersCount: 2450,
        followingCount: 120,
        topicsCount: 45,
      },
      chatId: '6',
      createdAt: new Date(2023, 6, 5, 14, 30).toISOString(),
      readBy: ['1', '6'],
    }
  ]
};

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;
}

export interface ChatStore extends ChatState {
  fetchChats: () => Promise<void>;
  fetchChatById: (id: string) => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (message: CreateMessagePayload) => Promise<void>;
  createChat: (chatData: CreateChatPayload) => Promise<string>;
  markChatAsRead: (chatId: string) => Promise<void>;
  updateChatSettings: (chatId: string, settings: Partial<Chat>) => Promise<void>;
  // WebSocket相关方法
  addWebSocketMessage: (message: ChatMessage) => void;
  joinChatRooms: (chatIds: string[]) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: mockChats,
      currentChat: null,
      messages: mockMessages,
      isLoading: false,
      error: null,

      fetchChats: async () => {
        set({ isLoading: true, error: null });
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000));

          // 在实际应用中，我们会从API获取
          set({ chats: mockChats, isLoading: false });
        } catch (error) {
          console.error("获取聊天列表失败:", error);
          set({ error: "获取聊天列表失败", isLoading: false });
        }
      },

      fetchChatById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 500));

          const chat = mockChats.find(c => c.id === id);

          if (chat) {
            set({ currentChat: chat, isLoading: false });
          } else {
            console.error("未找到聊天:", id);
            set({ error: "未找到聊天", isLoading: false });
          }
        } catch (error) {
          console.error("获取聊天详情失败:", error);
          set({ error: "获取聊天详情失败", isLoading: false });
        }
      },

      fetchMessages: async (chatId: string) => {
        set({ isLoading: true, error: null });
        try {
          // 模拟API调用，但延迟较短
          await new Promise(resolve => setTimeout(resolve, 300));

          const chatMessages = mockMessages[chatId] || [];

          const updatedMessages = { ...get().messages };
          updatedMessages[chatId] = chatMessages;

          set({ messages: updatedMessages, isLoading: false });
        } catch (error) {
          console.error("获取消息失败:", error);
          set({ error: "获取消息失败", isLoading: false });
        }
      },

      sendMessage: async (messageData: CreateMessagePayload) => {
        try {
          const user = useAuthStore.getState().user;

          if (!user) {
            console.error("未认证");
            throw new Error("未认证");
          }

          const chatId = messageData.chatId;

          // 创建新消息
          const newMessage: Message = {
            id: String(Date.now()),
            content: messageData.content || "",
            senderId: user.id,
            sender: user,
            chatId,
            createdAt: new Date().toISOString(),
            readBy: [user.id],
            images: messageData.images,
          };

          // 获取当前状态
          const currentMessages = { ...get().messages };
          const currentChats = [...get().chats];

          // 更新状态中的消息
          const chatMessages = currentMessages[chatId] || [];
          currentMessages[chatId] = [...chatMessages, newMessage];

          // 更新聊天的最后一条消息和更新时间
          const chatIndex = currentChats.findIndex(c => c.id === chatId);

          if (chatIndex !== -1) {
            currentChats[chatIndex] = {
              ...currentChats[chatIndex],
              lastMessage: newMessage,
              updatedAt: new Date().toISOString(),
            };
          }

          // 立即更新状态而不延迟
          set({
            messages: currentMessages,
            chats: currentChats,
            isLoading: false
          });

          return Promise.resolve();
        } catch (error) {
          console.error("发送消息失败:", error);
          return Promise.reject(error);
        }
      },

      createChat: async (chatData: CreateChatPayload): Promise<string> => {
        set({ isLoading: true, error: null });
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000));

          const user = useAuthStore.getState().user;

          if (!user) {
            console.error("未认证");
            set({ error: "未认证", isLoading: false });
            throw new Error("未认证");
          }

          // 检查聊天是否已存在（针对私聊）
          if (!chatData.isGroup && chatData.participants.length === 1) {
            const otherUserId = chatData.participants[0];
            const existingChat = get().chats.find(
              c => !c.isGroup && c.participants.some(p => p.id === otherUserId)
            );

            if (existingChat) {
              set({ isLoading: false });
              return existingChat.id;
            }
          }

          // 创建新的聊天
          const newChat: Chat = {
            id: String(Date.now()),
            name: chatData.name,
            isGroup: chatData.isGroup,
            participants: [
              user,
              ...mockChats[0].participants.filter(p =>
                chatData.participants.includes(p.id) && p.id !== user.id
              ),
            ],
            topicId: chatData.topicId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            unreadCount: 0,
            isMuted: false,
          };

          const updatedChats = [newChat, ...get().chats];

          // 为此聊天初始化空消息列表
          const updatedMessages = { ...get().messages };
          updatedMessages[newChat.id] = [];

          set({
            chats: updatedChats,
            messages: updatedMessages,
            currentChat: newChat,
            isLoading: false
          });

          return newChat.id;
        } catch (error) {
          console.error("创建聊天失败:", error);
          set({
            error: "创建聊天失败",
            isLoading: false
          });
          throw error;
        }
      },

      markChatAsRead: async (chatId: string) => {
        try {
          const user = useAuthStore.getState().user;

          if (!user) {
            console.error("未认证");
            return;
          }

          // 获取当前状态
          const currentChats = [...get().chats];
          const currentMessages = { ...get().messages };

          // 查找聊天
          const chatIndex = currentChats.findIndex(c => c.id === chatId);

          if (chatIndex === -1) {
            console.error("聊天未找到:", chatId);
            return;
          }

          // 更新聊天未读计数
          currentChats[chatIndex] = {
            ...currentChats[chatIndex],
            unreadCount: 0,
          };

          // 将所有消息标记为当前用户已读
          if (currentMessages[chatId]) {
            currentMessages[chatId] = currentMessages[chatId].map(message => {
              if (!message.readBy.includes(user.id)) {
                return {
                  ...message,
                  readBy: [...message.readBy, user.id],
                };
              }
              return message;
            });
          }

          // 更新状态
          set({
            chats: currentChats,
            messages: currentMessages,
          });

          return Promise.resolve();
        } catch (error) {
          console.error("标记聊天为已读失败:", error);
          return Promise.reject(error);
        }
      },

      updateChatSettings: async (chatId: string, settings: Partial<Chat>) => {
        try {
          // 获取当前状态
          const currentChats = [...get().chats];

          // 查找聊天
          const chatIndex = currentChats.findIndex(c => c.id === chatId);

          if (chatIndex === -1) {
            console.error("聊天未找到:", chatId);
            return Promise.reject(new Error("聊天未找到"));
          }

          // 更新聊天设置
          currentChats[chatIndex] = {
            ...currentChats[chatIndex],
            ...settings,
            updatedAt: new Date().toISOString(),
          };

          // 更新状态
          set({ chats: currentChats });

          return Promise.resolve();
        } catch (error) {
          console.error("更新聊天设置失败:", error);
          return Promise.reject(error);
        }
      },

      // WebSocket相关方法
      addWebSocketMessage: (message: ChatMessage) => {
        const { messages, chats } = get();
        const chatId = message.chat_id;

        // 确保消息对象格式正确
        if (!message.message_id || !message.chat_id) {
          console.error('消息缺少必要字段', message);
          return;
        }

        // 转换WebSocket消息为应用消息格式
        const appMessage: Message = {
          id: message.message_id,
          content: message.message,
          senderId: message.user_id,
          sender: {
            id: message.user_id,
            type: 'person',
            email: '',
            username: message.user_id,
            displayName: message.nickname || '未知用户',
            avatar: message.avatar_url,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            followersCount: 0,
            followingCount: 0,
            topicsCount: 0,
            likesCount: 0,
            lastActiveAt: new Date().toISOString(),
          },
          chatId: message.chat_id,
          createdAt: message.at,
          readBy: [message.user_id],
        };

        // 更新消息列表
        const chatMessages = messages[chatId] || [];
        const updatedMessages = { ...messages };

        // 避免重复消息
        if (!chatMessages.some(msg => msg.id === appMessage.id)) {
          updatedMessages[chatId] = [...chatMessages, appMessage];
        }

        // 更新聊天列表
        const chatIndex = chats.findIndex(c => c.id === chatId);
        let updatedChats = [...chats];

        if (chatIndex !== -1) {
          // 更新现有聊天
          const currentUserId = useAuthStore.getState().user?.id;
          const isFromCurrentUser = message.user_id === currentUserId;

          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            lastMessage: appMessage,
            updatedAt: new Date().toISOString(),
            unreadCount: isFromCurrentUser
              ? updatedChats[chatIndex].unreadCount
              : updatedChats[chatIndex].unreadCount + 1
          };
        } else {
          // 这个聊天不在列表中，可能需要获取聊天信息
          console.log('收到未知聊天室的消息:', chatId);
          // 如果需要，可以在这里发起请求获取聊天信息
        }

        // 更新状态
        set({
          messages: updatedMessages,
          chats: updatedChats
        });
      },

      joinChatRooms: (chatIds: string[]) => {
        // 此方法可用于在WebSocket服务中加入多个聊天室
        import('@/services/websocket-service')
          .then(module => {
            const WebSocketService = module.default;
            if (WebSocketService.isConnected()) {
              WebSocketService.joinChats(chatIds);
            } else {
              console.error('WebSocket未连接，无法加入聊天室');
            }
          })
          .catch(error => {
            console.error('导入WebSocket服务失败:', error);
          });
      }
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);