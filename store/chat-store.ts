// store/chat-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chat, CreateChatPayload, CreateMessagePayload, Message } from '@/types/chat';
import { useAuthStore } from './auth-store';
import { ChatMessage } from '@/services/websocket-service';
import ApiService from '@/services/api-service';
import WebSocketService from '@/services/websocket-service';
import EventEmitter from '@/utils/event-emitter';
import FirebaseStorageService from '@/services/firebase-storage-service';
import { User, UserProfile } from '@/types/user';

// API响应接口定义
interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
}

interface ChatListResponse {
  chats: any[];
}

interface ChatDetailResponse {
  chat: any;
}

interface ChatMessagesResponse {
  messages: any[];
}

interface ChatCreateResponse {
  chat_id: string;
}

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
      status: 'delivered',
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
    status: apiMessage.status || 'delivered',
  };
};

// 上传图片到存储
const uploadImageToStorage = async (imagePath: string, chatId: string): Promise<string> => {
  if (!imagePath) return '';

  try {
    // 如果已经是存储路径，直接返回
    if (!imagePath.startsWith('file://') && !imagePath.startsWith('content://')) {
      return imagePath;
    }

    // 从URI加载图片数据
    const response = await fetch(imagePath);
    const blob = await response.blob();

    // 上传到Firebase Storage
    const path = await FirebaseStorageService.uploadImage(
      blob,
      'chats',
      chatId,
      undefined,
      (progress: number) => console.log(`上传进度: ${progress}%`)
    );

    return path;
  } catch (error) {
    console.error('上传图片到存储失败:', error);
    throw error;
  }
};

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
  pendingMessages: Message[];
}

export interface ChatStore extends ChatState {
  fetchChats: () => Promise<void>;
  fetchChatById: (id: string) => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (message: CreateMessagePayload & { retryMessageId?: string }) => Promise<void>;
  createChat: (chatData: CreateChatPayload) => Promise<string>;
  markChatAsRead: (chatId: string) => Promise<void>;
  updateChatSettings: (chatId: string, settings: Partial<Chat>) => Promise<void>;
  // WebSocket相关方法
  addWebSocketMessage: (message: ChatMessage) => void;
  joinChatRooms: (chatIds: string[]) => void;
  processNextPendingMessage: () => Promise<void>;
  updateMessageStatus: (messageId: string, chatId: string, status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed') => void;
  setConnectionStatus: (status: 'connected' | 'connecting' | 'reconnecting' | 'disconnected') => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      currentChat: null,
      messages: {},
      isLoading: false,
      error: null,
      connectionStatus: 'disconnected',
      pendingMessages: [],

      // 设置连接状态
      setConnectionStatus: (status: 'connected' | 'connecting' | 'reconnecting' | 'disconnected') => {
        set({ connectionStatus: status });
      },

      fetchChats: async () => {
        set({ isLoading: true, error: null });
        try {
          // 调用API获取聊天列表
          const response = await ApiService.get<ApiResponse<ChatListResponse>>('/auth/chats');

          // 检查响应是否成功
          if (response.code !== 0) {
            throw new Error(response.message || "获取聊天列表失败");
          }

          // 转换API数据格式
          const chats = response.data.chats.map((apiChat: any) => convertApiChatToChat(apiChat));

          set({ chats, isLoading: false });

          // 加入所有聊天室的WebSocket
          const chatIds = chats.map((chat: Chat) => chat.id);

          // 确保WebSocket连接
          if (!WebSocketService.isConnected()) {
            await WebSocketService.connectAsync();
          }

          WebSocketService.joinChats(chatIds);

        } catch (error: any) {
          console.error("获取聊天列表失败:", error);
          set({ error: error.message || "获取聊天列表失败", isLoading: false });
        }
      },

      // fetchChatById: async (id: string) => {
      //   set({ isLoading: true, error: null });
      //   try {
      //     // 调用API获取单个聊天详情
      //     const response = await ApiService.get<ApiResponse<ChatDetailResponse>>(`/auth/chats/${id}`);

      //     if (response.code !== 0) {
      //       throw new Error(response.message || "获取聊天详情失败");
      //     }

      //     const chat = convertApiChatToChat(response.data.chat);

      //     set({ currentChat: chat, isLoading: false });

      //     // 确保WebSocket连接
      //     if (!WebSocketService.isConnected()) {
      //       await WebSocketService.connectAsync();
      //     }

      //     // 加入聊天室WebSocket
      //     WebSocketService.joinChat(id);

      //   } catch (error: any) {
      //     console.error("获取聊天详情失败:", error);
      //     set({ error: error.message || "获取聊天详情失败", isLoading: false });
      //   }
      // },
      fetchChatById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // 使用模拟数据，添加类型断言
          const mockChat: Chat = {
            id: id,
            name: "测试聊天室",
            isGroup: true,
            participants: [
              {
                id: useAuthStore.getState().user?.id || "current-user",
                type: 'person' as 'person', // 添加类型断言，确保类型是字面量类型而非string
                email: 'test@example.com',
                username: 'testuser',
                displayName: '当前用户',
                avatar: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                followersCount: 0,
                followingCount: 0,
                topicsCount: 0,
                likesCount: 0,         // 添加缺少的必要属性
                lastActiveAt: new Date().toISOString() // 添加缺少的必要属性
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            unreadCount: 0
          };

          set({ currentChat: mockChat, isLoading: false });

          // 尝试建立WebSocket连接，但即使失败也能继续
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
          const response = await ApiService.get<ApiResponse<ChatMessagesResponse>>(`/auth/chats/${chatId}/messages`);

          if (response.code !== 0) {
            throw new Error(response.message || "获取消息失败");
          }

          // 转换API消息格式
          const messages = response.data.messages.map((apiMessage: any) => convertApiMessageToMessage(apiMessage));

          // 更新消息
          const updatedMessages = { ...get().messages };
          updatedMessages[chatId] = messages;

          set({ messages: updatedMessages, isLoading: false });

          // 标记为已读
          get().markChatAsRead(chatId);

        } catch (error: any) {
          console.error("获取消息失败:", error);
          set({ error: error.message || "获取消息失败", isLoading: false });
        }
      },

      sendMessage: async ({ content, chatId, images, retryMessageId }: CreateMessagePayload & { retryMessageId?: string }) => {
        try {
          const user = useAuthStore.getState().user;

          if (!user) {
            throw new Error("未认证");
          }

          let messageId = retryMessageId || `temp-${Date.now()}`;
          let uploadedImages: string[] = [];

          // 先检查连接状态
          if (get().connectionStatus === 'disconnected') {
            // 如果是重试，先设置状态为正在发送
            if (retryMessageId) {
              get().updateMessageStatus(retryMessageId, chatId, 'sending');
            }

            // 尝试重新连接
            try {
              set({ connectionStatus: 'connecting' });
              const connected = await WebSocketService.connectAsync();

              if (!connected) {
                throw new Error("无法连接到消息服务器");
              }

              set({ connectionStatus: 'connected' });
            } catch (connError) {
              set({ connectionStatus: 'disconnected' });
              throw new Error("无法连接到消息服务器，请检查网络连接");
            }
          }

          // 处理图片上传
          if (images && images.length > 0) {
            try {
              // 上传所有图片
              const uploadPromises = images.map((img: string) => uploadImageToStorage(img, chatId));
              uploadedImages = await Promise.all(uploadPromises);
            } catch (uploadError) {
              console.error("上传图片失败:", uploadError);
              // 如果是重试消息，将其状态设为失败
              if (retryMessageId) {
                get().updateMessageStatus(retryMessageId, chatId, 'failed');
              }
              throw new Error("上传图片失败");
            }
          }

          // 如果是重试，使用现有的临时消息
          // 如果不是重试，创建新的临时消息
          if (!retryMessageId) {
            // 1. 乐观更新UI - 先在本地添加临时消息
            const tempMessage: Message = {
              id: messageId,
              content: content || "",
              senderId: user.id,
              sender: user,
              chatId,
              createdAt: new Date().toISOString(),
              readBy: [user.id],
              images: uploadedImages.length > 0 ? uploadedImages : undefined,
              status: 'sending'
            };

            // 更新本地状态
            const currentMessages = { ...get().messages };
            const chatMessages = currentMessages[chatId] || [];
            currentMessages[chatId] = [...chatMessages, tempMessage];

            // 更新聊天的最后一条消息和未读数
            const currentChats = [...get().chats];
            const chatIndex = currentChats.findIndex((c: Chat) => c.id === chatId);

            if (chatIndex !== -1) {
              currentChats[chatIndex] = {
                ...currentChats[chatIndex],
                lastMessage: tempMessage,
                updatedAt: new Date().toISOString(),
              };
            }

            set({
              messages: currentMessages,
              chats: currentChats
            });
          }

          // 2. 通过WebSocket发送消息
          if (content) {
            WebSocketService.sendMessage(content, chatId);
          }

          // 3. 如果有图片，为每张图片发送一条图片消息
          if (uploadedImages.length > 0) {
            for (const imgPath of uploadedImages) {
              // 延迟一些再发送图片消息(避免并发请求过多)
              await new Promise(resolve => setTimeout(resolve, 300));
              WebSocketService.sendMessage(`[图片]`, chatId, imgPath);
            }
          }

          // 4. 更新消息状态为已发送
          get().updateMessageStatus(messageId, chatId, 'sent');

        } catch (error: any) {
          console.error("发送消息失败:", error);

          // 更新消息状态为发送失败
          if (retryMessageId) {
            get().updateMessageStatus(retryMessageId, chatId, 'failed');
          } else {
            get().updateMessageStatus(`temp-${Date.now()}`, chatId, 'failed');
          }

          throw error;
        }
      },

      // 更新消息状态的辅助方法
      updateMessageStatus: (messageId: string, chatId: string, status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed') => {
        const { messages } = get();
        const chatMessages = messages[chatId] || [];

        // 查找消息
        const messageIndex = chatMessages.findIndex((m: Message) => m.id === messageId);
        if (messageIndex === -1) return;

        // 创建更新后的消息列表
        const updatedMessages = { ...messages };
        const updatedChatMessages = [...chatMessages];

        // 更新消息状态
        updatedChatMessages[messageIndex] = {
          ...updatedChatMessages[messageIndex],
          status
        };

        updatedMessages[chatId] = updatedChatMessages;

        // 更新状态
        set({ messages: updatedMessages });

        // 同时更新聊天列表中的最后一条消息
        const chats = [...get().chats];
        const chatIndex = chats.findIndex((c: Chat) => c.id === chatId);

        if (chatIndex !== -1 && chats[chatIndex].lastMessage?.id === messageId) {
          chats[chatIndex] = {
            ...chats[chatIndex],
            lastMessage: {
              ...chats[chatIndex].lastMessage!,
              status
            }
          };

          set({ chats });
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
              (c: Chat) => !c.isGroup && c.participants.some((p: UserProfile) => p.id === otherUserId)
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
          const response = await ApiService.post<ApiResponse<ChatCreateResponse>>('/auth/chats', apiChatData);

          if (response.code !== 0) {
            throw new Error(response.message || "创建聊天失败");
          }

          const newChatId = response.data.chat_id;

          // 重新获取聊天列表，包含新创建的聊天
          await get().fetchChats();

          // 获取新创建的聊天详情
          await get().fetchChatById(newChatId);

          // 确保WebSocket连接
          if (!WebSocketService.isConnected()) {
            await WebSocketService.connectAsync();
          }

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
          const chatIndex = currentChats.findIndex((c: Chat) => c.id === chatId);

          if (chatIndex !== -1) {
            currentChats[chatIndex] = {
              ...currentChats[chatIndex],
              unreadCount: 0,
            };
          }

          // 更新消息的已读状态
          const currentMessages = { ...get().messages };
          if (currentMessages[chatId]) {
            currentMessages[chatId] = currentMessages[chatId].map((message: Message) => {
              if (!message.readBy.includes(user.id)) {
                return {
                  ...message,
                  readBy: [...message.readBy, user.id],
                  status: 'read'
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
          const response = await ApiService.put<ApiResponse<{ success: boolean }>>(`/auth/chats/${chatId}/settings`, apiSettings);

          if (response.code !== 0) {
            throw new Error(response.message || "更新聊天设置失败");
          }

          // 更新本地状态
          const currentChats = [...get().chats];
          const chatIndex = currentChats.findIndex((c: Chat) => c.id === chatId);

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
          // 如果消息中包含图片URL
          images: message.img_url ? [message.img_url] : undefined,
          status: 'delivered'
        };

        // 更新消息列表
        const chatMessages = messages[chatId] || [];
        const updatedMessages = { ...messages };

        // 避免重复消息
        if (!chatMessages.some((msg: Message) => msg.id === appMessage.id)) {
          updatedMessages[chatId] = [...chatMessages, appMessage];
        }

        // 更新聊天列表
        const chatIndex = chats.findIndex((c: Chat) => c.id === chatId);
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

        // 处理当前用户发送的消息确认
        const currentUserId = useAuthStore.getState().user?.id;
        if (message.user_id === currentUserId) {
          // 在用户发送的临时消息中查找与此消息内容匹配的项
          const tempMessageIndex = chatMessages.findIndex((msg: Message) =>
            msg.senderId === currentUserId &&
            msg.status === 'sending' &&
            msg.content === message.message
          );

          if (tempMessageIndex !== -1) {
            // 找到临时消息，将其ID和状态更新为真实消息ID和已发送状态
            const tempId = chatMessages[tempMessageIndex].id;

            // 创建新的消息数组，替换旧的临时消息
            const newChatMessages = [...chatMessages];
            newChatMessages[tempMessageIndex] = {
              ...newChatMessages[tempMessageIndex],
              id: message.message_id,
              status: 'delivered',
              createdAt: message.at
            };

            updatedMessages[chatId] = newChatMessages;

            // 如果需要更新最后一条消息
            if (updatedChats[chatIndex]?.lastMessage?.id === tempId) {
              updatedChats[chatIndex] = {
                ...updatedChats[chatIndex],
                lastMessage: {
                  ...updatedChats[chatIndex].lastMessage!,
                  id: message.message_id,
                  status: 'delivered',
                  createdAt: message.at
                }
              };
            }

            set({
              messages: updatedMessages,
              chats: updatedChats
            });
          }
        }
      },

      joinChatRooms: (chatIds: string[]) => {
        WebSocketService.joinChats(chatIds);
      },

      // 处理待发送消息队列
      processNextPendingMessage: async () => {
        const { pendingMessages } = get();

        if (pendingMessages.length === 0) return;

        // 取出第一条待发送消息
        const [nextMessage, ...remainingMessages] = pendingMessages;

        // 更新状态，移除该消息
        set({ pendingMessages: remainingMessages });

        try {
          // 尝试发送消息
          await get().sendMessage({
            content: nextMessage.content,
            chatId: nextMessage.chatId,
            images: nextMessage.images,
            retryMessageId: nextMessage.id
          });
        } catch (error) {
          console.error('处理待发送消息失败:', error);
          // 将消息重新加入队列末尾
          set({ pendingMessages: [...remainingMessages, nextMessage] });
        }
      }
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        chats: state.chats,
        // 仅持久化状态不是'failed'的消息
        messages: Object.entries(state.messages).reduce((acc, [chatId, msgs]) => {
          acc[chatId] = msgs.filter((m: Message) => m.status !== 'failed');
          return acc;
        }, {} as Record<string, Message[]>),
        pendingMessages: state.pendingMessages.filter((m: Message) => m.status !== 'failed'),
      }),
    }
  )
);

// 监听WebSocket连接状态变化
WebSocketService.onConnectionStatusChange((status: string) => {
  const chatStore = useChatStore.getState();

  switch (status) {
    case 'connected':
      chatStore.setConnectionStatus('connected');

      // 处理待发送的消息
      chatStore.processNextPendingMessage();
      break;

    case 'connecting':
      chatStore.setConnectionStatus('connecting');
      break;

    case 'reconnecting':
      chatStore.setConnectionStatus('reconnecting');
      break;

    case 'disconnected':
      chatStore.setConnectionStatus('disconnected');
      break;
  }
});

// 监听WebSocket消息
WebSocketService.onMessage((message: ChatMessage) => {
  const chatStore = useChatStore.getState();
  chatStore.addWebSocketMessage(message);
});

// 注册WebSocket连接丢失事件处理
EventEmitter.on('WEBSOCKET_CONNECTION_LOST', () => {
  const chatStore = useChatStore.getState();
  chatStore.setConnectionStatus('disconnected');
});