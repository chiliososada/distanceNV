// store/chat-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chat, CreateChatPayload, CreateMessagePayload, Message } from '@/types/chat';
import { useAuthStore } from './auth-store';
import { ChatMessage } from '@/services/websocket-service';
import ApiService from '@/services/api-service';
import WebSocketService from '@/services/websocket-service';

// 类型转换函数 - 将API响应转换为应用内部类型
const convertApiChatToChat = (apiChat: any): Chat => {
  return {
    id: apiChat.uid,
    name: apiChat.name,
    isGroup: apiChat.is_group,
    participants: apiChat.participants.map((p: any) => ({
      id: p.uid,
      type: p.type || 'person',
      email: p.email || '',
      username: p.username || p.uid,
      displayName: p.display_name || p.nickname || '未知用户',
      avatar: p.avatar_url || p.photo_url,
      createdAt: p.created_at || new Date().toISOString(),
      updatedAt: p.updated_at || new Date().toISOString(),
      followersCount: p.followers_count || 0,
      followingCount: p.following_count || 0,
      topicsCount: p.topics_count || 0,
    })),
    lastMessage: apiChat.last_message ? {
      id: apiChat.last_message.uid,
      content: apiChat.last_message.content,
      senderId: apiChat.last_message.sender_id,
      sender: {
        id: apiChat.last_message.sender_id,
        type: 'person',
        email: '',
        username: apiChat.last_message.sender_id,
        displayName: apiChat.last_message.sender_name || '未知用户',
        avatar: apiChat.last_message.sender_avatar,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        followersCount: 0,
        followingCount: 0,
        topicsCount: 0,
      },
      chatId: apiChat.uid,
      createdAt: apiChat.last_message.created_at,
      readBy: apiChat.last_message.read_by || [],
      images: apiChat.last_message.images || [],
    } : undefined,
    createdAt: apiChat.created_at,
    updatedAt: apiChat.updated_at,
    unreadCount: apiChat.unread_count || 0,
    isMuted: apiChat.is_muted || false,
    topicId: apiChat.topic_id,
  };
};

const convertApiMessageToMessage = (apiMessage: any): Message => {
  return {
    id: apiMessage.uid,
    content: apiMessage.content,
    senderId: apiMessage.sender_id,
    sender: {
      id: apiMessage.sender_id,
      type: 'person',
      email: '',
      username: apiMessage.sender_id,
      displayName: apiMessage.sender_name || '未知用户',
      avatar: apiMessage.sender_avatar,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      followersCount: 0,
      followingCount: 0,
      topicsCount: 0,
    },
    chatId: apiMessage.chat_id,
    createdAt: apiMessage.created_at,
    readBy: apiMessage.read_by || [],
    images: apiMessage.images || [],
  };
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
      chats: [],
      currentChat: null,
      messages: {},
      isLoading: false,
      error: null,

      fetchChats: async () => {
        set({ isLoading: true, error: null });
        try {
          // 调用API获取聊天列表
          const response = await ApiService.get('/auth/chats');

          // 检查响应是否成功
          if (response.code !== 0) {
            throw new Error(response.message || "获取聊天列表失败");
          }

          // 转换API数据格式
          const chats = response.data.chats.map(convertApiChatToChat);

          set({ chats, isLoading: false });

          // 加入所有聊天室的WebSocket
          const chatIds = chats.map(chat => chat.id);
          WebSocketService.joinChats(chatIds);

        } catch (error: any) {
          console.error("获取聊天列表失败:", error);
          set({ error: error.message || "获取聊天列表失败", isLoading: false });
        }
      },

      fetchChatById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // 调用API获取单个聊天详情
          const response = await ApiService.get(`/auth/chats/${id}`);

          if (response.code !== 0) {
            throw new Error(response.message || "获取聊天详情失败");
          }

          const chat = convertApiChatToChat(response.data.chat);

          set({ currentChat: chat, isLoading: false });

          // 加入聊天室WebSocket
          WebSocketService.joinChat(id);

        } catch (error: any) {
          console.error("获取聊天详情失败:", error);
          set({ error: error.message || "获取聊天详情失败", isLoading: false });
        }
      },

      fetchMessages: async (chatId: string) => {
        set({ isLoading: true, error: null });
        try {
          // 调用API获取消息历史
          const response = await ApiService.get(`/auth/chats/${chatId}/messages`);

          if (response.code !== 0) {
            throw new Error(response.message || "获取消息失败");
          }

          // 转换API消息格式
          const messages = response.data.messages.map(convertApiMessageToMessage);

          // 更新消息
          const updatedMessages = { ...get().messages };
          updatedMessages[chatId] = messages;

          set({ messages: updatedMessages, isLoading: false });

        } catch (error: any) {
          console.error("获取消息失败:", error);
          set({ error: error.message || "获取消息失败", isLoading: false });
        }
      },

      sendMessage: async (messageData: CreateMessagePayload) => {
        try {
          const user = useAuthStore.getState().user;

          if (!user) {
            throw new Error("未认证");
          }

          const chatId = messageData.chatId;
          const content = messageData.content || "";

          // 1. 乐观更新UI - 先在本地添加消息
          const newMessage: Message = {
            id: `temp-${Date.now()}`, // 临时ID，后端返回后会更新
            content: content,
            senderId: user.id,
            sender: user,
            chatId,
            createdAt: new Date().toISOString(),
            readBy: [user.id],
            images: messageData.images,
          };

          // 更新本地状态
          const currentMessages = { ...get().messages };
          const chatMessages = currentMessages[chatId] || [];
          currentMessages[chatId] = [...chatMessages, newMessage];

          // 更新聊天的最后一条消息和未读数
          const currentChats = [...get().chats];
          const chatIndex = currentChats.findIndex(c => c.id === chatId);

          if (chatIndex !== -1) {
            currentChats[chatIndex] = {
              ...currentChats[chatIndex],
              lastMessage: newMessage,
              updatedAt: new Date().toISOString(),
            };
          }

          set({
            messages: currentMessages,
            chats: currentChats
          });

          // 2. 通过WebSocket发送消息
          WebSocketService.sendMessage(content, chatId);

          // 3. 如果有图片，还需要上传图片
          if (messageData.images && messageData.images.length > 0) {
            // 在实际应用中，这里应该有上传图片的逻辑
            // 上传完成后，可能需要再发送一条带图片的消息或更新当前消息

            // 示例：上传图片后发送消息
            // await ApiService.post(`/auth/chats/${chatId}/upload-images`, { images: messageData.images });
            // WebSocketService.sendMessage("📷 图片", chatId);
          }

        } catch (error: any) {
          console.error("发送消息失败:", error);
          // 可以考虑更新UI状态，显示发送失败
        }
      },

      createChat: async (chatData: CreateChatPayload): Promise<string> => {
        set({ isLoading: true, error: null });
        try {
          const user = useAuthStore.getState().user;

          if (!user) {
            throw new Error("未认证");
          }

          // 检查是否是一对一聊天且聊天已存在
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

          // 准备API请求数据
          const apiChatData = {
            participants: chatData.participants,
            is_group: chatData.isGroup,
            name: chatData.name,
            topic_id: chatData.topicId
          };

          // 调用API创建聊天
          const response = await ApiService.post('/auth/chats', apiChatData);

          if (response.code !== 0) {
            throw new Error(response.message || "创建聊天失败");
          }

          const newChatId = response.data.chat_id;

          // 重新获取聊天列表，包含新创建的聊天
          await get().fetchChats();

          // 获取新创建的聊天详情
          await get().fetchChatById(newChatId);

          // 加入WebSocket聊天室
          WebSocketService.joinChat(newChatId);

          set({ isLoading: false });

          return newChatId;

        } catch (error: any) {
          console.error("创建聊天失败:", error);
          set({ error: error.message || "创建聊天失败", isLoading: false });
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

          // 调用API标记为已读
          await ApiService.post(`/auth/chats/${chatId}/read`, {});

          // 更新本地状态
          const currentChats = [...get().chats];
          const chatIndex = currentChats.findIndex(c => c.id === chatId);

          if (chatIndex !== -1) {
            currentChats[chatIndex] = {
              ...currentChats[chatIndex],
              unreadCount: 0,
            };
          }

          // 更新消息的已读状态
          const currentMessages = { ...get().messages };
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

          set({
            chats: currentChats,
            messages: currentMessages,
          });

        } catch (error: any) {
          console.error("标记为已读失败:", error);
        }
      },

      updateChatSettings: async (chatId: string, settings: Partial<Chat>) => {
        try {
          // 准备API请求数据
          const apiSettings: any = {};

          if (settings.name !== undefined) apiSettings.name = settings.name;
          if (settings.isMuted !== undefined) apiSettings.is_muted = settings.isMuted;

          // 调用API更新聊天设置
          const response = await ApiService.put(`/auth/chats/${chatId}/settings`, apiSettings);

          if (response.code !== 0) {
            throw new Error(response.message || "更新聊天设置失败");
          }

          // 更新本地状态
          const currentChats = [...get().chats];
          const chatIndex = currentChats.findIndex(c => c.id === chatId);

          if (chatIndex !== -1) {
            currentChats[chatIndex] = {
              ...currentChats[chatIndex],
              ...settings,
              updatedAt: new Date().toISOString(),
            };
          }

          set({ chats: currentChats });

        } catch (error: any) {
          console.error("更新聊天设置失败:", error);
          throw error;
        }
      },

      // WebSocket相关方法
      addWebSocketMessage: (message: ChatMessage) => {
        // 确保消息对象格式正确
        if (!message.message_id || !message.chat_id) {
          console.error('消息缺少必要字段', message);
          return;
        }

        const { messages, chats } = get();
        const chatId = message.chat_id;

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
          // 聊天不在列表中，可能需要获取聊天信息
          console.log('收到未知聊天室的消息:', chatId);
          // 可选：获取新聊天信息
          get().fetchChatById(chatId).catch(console.error);
        }

        // 更新状态
        set({
          messages: updatedMessages,
          chats: updatedChats
        });
      },

      joinChatRooms: (chatIds: string[]) => {
        WebSocketService.joinChats(chatIds);
      }
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);