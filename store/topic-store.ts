// store/topic-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Topic, CreateTopicPayload, TopicFilter, ApiTopic } from '@/types/topic';
import { useAuthStore } from './auth-store';
import TopicService from '@/services/topic-service';
import { getFirebaseImageUrls } from '@/utils/firebase-storage';

// 将 API 返回的话题数据转换为应用使用的格式
const convertApiTopicToTopic = async (apiTopic: ApiTopic, currentUserId?: string): Promise<Topic> => {
  // 获取 Firebase 存储中的图片 URL
  const imageUrls = await getFirebaseImageUrls(apiTopic.topic_images);

  // 创建应用使用的话题对象
  return {
    id: apiTopic.uid,
    title: apiTopic.title,
    content: apiTopic.content,
    author: {
      id: apiTopic.user_uid,
      type: 'person', // 默认为个人用户
      email: '', // API 未提供邮箱
      username: apiTopic.user_uid, // 使用用户 ID 作为用户名
      displayName: apiTopic.user.nickname || '未知用户',
      bio: '',
      avatar: apiTopic.user.avatar_url,
      gender: apiTopic.user.gender as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      followersCount: 0,
      followingCount: 0,
      topicsCount: 0,
      likesCount: 0,
      lastActiveAt: new Date().toISOString(),
    },
    authorId: apiTopic.user_uid,
    images: imageUrls,
    tags: apiTopic.tags || [],
    location: {
      latitude: apiTopic.location_latitude,
      longitude: apiTopic.location_longitude,
      address: '', // API 未提供地址信息
    },
    distance: undefined, // 需要计算
    expiresAt: apiTopic.expires_at,
    createdAt: apiTopic.created_at,
    updatedAt: apiTopic.updated_at,
    likesCount: apiTopic.likes_count,
    commentsCount: apiTopic.participants_count,
    isLiked: false, // 需要从 API 获取
    chatId: apiTopic.chat_id,
  };
};

interface TopicState {
  topics: Topic[];
  filteredTopics: Topic[];
  userTopics: Topic[]; // 用户创建的话题
  likedTopics: Topic[]; // 用户点赞的话题
  currentTopic: Topic | null;
  isLoading: boolean;
  isLikedTopicsLoading: boolean;
  error: string | null;
  filter: TopicFilter;
  currentLastScore: number; // 上次加载的最后分数，用于分页
  hasMoreTopics: boolean;
}

export interface TopicStore extends TopicState {
  fetchTopics: () => Promise<void>;
  fetchUserTopics: (userId: string) => Promise<void>;
  fetchLikedTopics: (userId: string) => Promise<void>;
  fetchTopicById: (id: string) => Promise<void>;
  createTopic: (topic: CreateTopicPayload) => Promise<void>;
  updateTopic: (id: string, topic: Partial<CreateTopicPayload>) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  likeTopic: (id: string) => Promise<void>;
  setFilter: (filter: Partial<TopicFilter>) => void;
  applyFilters: () => void;
  loadMoreTopics: () => Promise<void>;
}

export const useTopicStore = create<TopicStore>()(
  persist(
    (set, get) => ({
      topics: [],
      filteredTopics: [],
      userTopics: [],
      likedTopics: [],
      currentTopic: null,
      isLoading: false,
      isLikedTopicsLoading: false,
      error: null,
      filter: {
        sort: 'recent',
      },
      currentLastScore: 0,
      hasMoreTopics: true,

      fetchTopics: async () => {
        set({ isLoading: true, error: null });
        try {
          // 重置分页状态
          set({ currentLastScore: 0 });

          // 调用 API 获取最新话题
          const response = await TopicService.findTopics({
            findby: "recent",
            max: 10,
            recency: 0
          });

          if (response.code !== 0) {
            throw new Error(response.message || "获取话题失败");
          }

          // 安全检查 - 确保response.data和response.data.topics存在且是数组
          if (!response.data || !response.data.topics || !Array.isArray(response.data.topics)) {
            console.error("API返回数据结构异常:", response);
            set({
              topics: [],
              filteredTopics: [],
              currentLastScore: 0,
              hasMoreTopics: false,
              isLoading: false,
              error: "获取话题数据格式错误"
            });
            return;
          }

          // 获取当前用户 ID
          const currentUser = useAuthStore.getState().user;
          const currentUserId = currentUser?.id;

          // 转换话题格式，添加错误处理
          const promises = response.data.topics.map(apiTopic =>
            convertApiTopicToTopic(apiTopic, currentUserId)
          );

          const topics = await Promise.all(promises);

          // 更新状态
          set({
            topics,
            filteredTopics: topics,
            currentLastScore: response.data.score || 0,
            hasMoreTopics: response.data.topics.length >= 10,
            isLoading: false
          });

          // 应用过滤
          get().applyFilters();
        } catch (error) {
          console.error("获取话题失败:", error);
          let errorMessage = "获取话题失败";

          if (error instanceof Error) {
            errorMessage = error.message;
          }

          set({
            error: errorMessage,
            isLoading: false,
            topics: [],      // 确保即使出错也有一个空数组
            filteredTopics: [] // 确保即使出错也有一个空数组
          });
        }
      },

      fetchUserTopics: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // 这里应该有一个通过用户 ID 获取话题的 API
          // 暂时使用主页的 API 并在前端过滤 需要修改
          const response = await TopicService.findTopics({
            findby: "recent",
            max: 50, // 获取更多以确保能找到当前用户的话题
            recency: 0
          });

          if (response.code !== 0) {
            throw new Error(response.message || "获取用户话题失败");
          }

          // 筛选用户创建的话题
          const userApiTopics = response.data.topics.filter(t => t.user_uid === userId);

          // 转换格式
          const promises = userApiTopics.map(apiTopic =>
            convertApiTopicToTopic(apiTopic, userId)
          );
          const userTopics = await Promise.all(promises);

          set({
            userTopics,
            isLoading: false
          });
        } catch (error: any) {
          console.error("获取用户话题失败:", error);
          set({
            error: error.message || "获取用户话题失败",
            isLoading: false,
            userTopics: [] // 确保即使出错也有一个数组
          });
        }
      },

      fetchLikedTopics: async (userId: string) => {
        set({ isLikedTopicsLoading: true, error: null });
        try {
          // 这里应该有一个获取用户点赞话题的 API
          // 暂时使用主页的 API，实际项目中需要替换
          const response = await TopicService.findTopics({
            findby: "liked", // 假设有这样的 API
            max: 10,
            recency: 0
          });

          if (response.code !== 0) {
            throw new Error(response.message || "获取点赞话题失败");
          }

          // 转换格式
          const promises = response.data.topics.map(apiTopic => {
            // 点赞页面的话题都是已经点赞过的
            const topic = convertApiTopicToTopic(apiTopic, userId);
            return topic.then(t => ({ ...t, isLiked: true }));
          });
          const likedTopics = await Promise.all(promises);

          set({
            likedTopics,
            isLikedTopicsLoading: false
          });
        } catch (error: any) {
          console.error("获取点赞话题失败:", error);
          set({
            error: error.message || "获取点赞话题失败",
            isLikedTopicsLoading: false,
            likedTopics: [] // 确保即使出错也有一个数组
          });
        }
      },

      // 在loadMoreTopics函数中进行错误处理
      loadMoreTopics: async () => {
        try {
          const { currentLastScore, isLoading, hasMoreTopics } = get();

          // 如果正在加载或没有更多话题，则不执行
          if (isLoading || !hasMoreTopics) return;

          set({ isLoading: true });

          // 调用 API 获取更多话题
          const response = await TopicService.findTopics({
            findby: "recent",
            max: 10,
            recency: currentLastScore
          });

          if (!response || response.code !== 0) {
            throw new Error(response?.message || "加载更多话题失败");
          }

          // 安全检查
          if (!response.data || !Array.isArray(response.data.topics)) {
            set({ hasMoreTopics: false, isLoading: false });
            return;
          }

          // 如果没有更多数据，设置 hasMoreTopics 为 false
          if (response.data.topics.length === 0) {
            set({ hasMoreTopics: false, isLoading: false });
            return;
          }

          // 获取当前用户 ID
          const currentUser = useAuthStore.getState().user;
          const currentUserId = currentUser?.id;

          // 转换格式，添加错误处理，并确保类型一致
          const newTopicsPromises = response.data.topics.map(async (apiTopic) => {
            try {
              return await convertApiTopicToTopic(apiTopic, currentUserId);
            } catch (error) {
              console.error("转换话题数据失败:", error);
              // 跳过这个话题，而不是返回默认值
              return null;
            }
          });

          try {
            const allNewTopics = await Promise.all(newTopicsPromises);
            // 过滤掉null值，确保类型一致性
            const newTopics = allNewTopics.filter((topic): topic is Topic => topic !== null);

            // 使用类型断言告诉TypeScript我们确保类型安全
            set((state) => {
              return {
                topics: [...state.topics, ...newTopics],
                currentLastScore: response.data.score || 0,
                hasMoreTopics: response.data.topics.length >= 10,
                isLoading: false,
                error: null
              } as Partial<TopicStore>;
            });

            // 安全地应用过滤器
            get().applyFilters();
          } catch (error) {
            console.error("处理话题数据失败:", error);
            set({ error: "处理话题数据失败", isLoading: false });
          }
        } catch (error) {
          console.error("加载更多话题失败:", error);

          let errorMessage = "加载更多话题失败";
          if (error instanceof Error) {
            errorMessage = error.message || errorMessage;
          }

          set({ error: errorMessage, isLoading: false });
        }
      },

      // fetchTopicById: async (id: string) => {
      //   set({ isLoading: true, error: null });
      //   try {
      //     // 调用 API 获取话题详情
      //     const response = await TopicService.getTopicById(id);

      //     if (response.code !== 0) {
      //       throw new Error(response.message || "获取话题详情失败");
      //     }

      //     const apiTopic = response.data.topic;

      //     // 获取当前用户 ID
      //     const currentUser = useAuthStore.getState().user;
      //     const currentUserId = currentUser?.id;

      //     // 转换为应用格式
      //     const topic = await convertApiTopicToTopic(apiTopic, currentUserId);

      //     set({ currentTopic: topic, isLoading: false });
      //   } catch (error: any) {
      //     console.error("获取话题详情失败:", error);
      //     set({ error: error.message || "获取话题详情失败", isLoading: false });
      //   }
      // }
      //
      fetchTopicById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // 获取所有话题列表
          const { topics, filteredTopics, userTopics, likedTopics } = get();

          // 从各个列表中查找话题
          let topic =
            topics.find(t => t.id === id) ||
            filteredTopics.find(t => t.id === id) ||
            userTopics.find(t => t.id === id) ||
            likedTopics.find(t => t.id === id);

          // 如果没有找到，并且话题列表为空，尝试加载话题列表
          if (!topic && topics.length === 0) {
            console.log('未找到话题，尝试加载话题列表');
            //这里注意要修改 现在是从所有的fetchTopics
            await get().fetchTopics();

            // 再次从话题列表中查找 
            topic = get().topics.find(t => t.id === id);
          }

          if (topic) {
            set({ currentTopic: topic, isLoading: false });
          } else {
            // 如果仍然没有找到，设置错误
            throw new Error(`话题 ${id} 不存在`);
          }
        } catch (error: any) {
          console.error("获取话题详情失败:", error);
          set({ error: error.message || "获取话题详情失败", isLoading: false });
        }
      },

      createTopic: async (topicData: CreateTopicPayload) => {
        set({ isLoading: true, error: null });
        try {
          // 准备 API 请求的数据
          const apiTopicData = {
            title: topicData.title,
            content: topicData.content,
            location_latitude: topicData.location.latitude,
            location_longitude: topicData.location.longitude,
            tags: topicData.tags,
            // 图片路径需要先上传到 Firebase 然后将路径传给 API
            topic_images: topicData.images, // 假设已经是 Firebase 路径
            expires_at: topicData.expiresAt
          };

          // 调用 API 创建话题
          const response = await TopicService.createTopic(apiTopicData);

          if (response.code !== 0) {
            throw new Error(response.message || "创建话题失败");
          }

          // 重新获取话题列表以更新 需要修改因为可能现在获取的东西不全
          await get().fetchTopics();

          set({ isLoading: false });
        } catch (error: any) {
          console.error("创建话题失败:", error);
          set({ error: error.message || "创建话题失败", isLoading: false });
        }
      },

      updateTopic: async (id: string, topicData: Partial<CreateTopicPayload>) => {
        set({ isLoading: true, error: null });
        try {
          // 准备 API 请求的数据
          const apiTopicData: any = {};

          if (topicData.title) apiTopicData.title = topicData.title;
          if (topicData.content) apiTopicData.content = topicData.content;
          if (topicData.location) {
            apiTopicData.location_latitude = topicData.location.latitude;
            apiTopicData.location_longitude = topicData.location.longitude;
          }
          if (topicData.tags) apiTopicData.tags = topicData.tags;
          if (topicData.images) apiTopicData.topic_images = topicData.images;
          if (topicData.expiresAt) apiTopicData.expires_at = topicData.expiresAt;

          // 调用 API 更新话题
          const response = await TopicService.updateTopic(id, apiTopicData);

          if (response.code !== 0) {
            throw new Error(response.message || "更新话题失败");
          }

          // 更新当前话题和话题列表
          await get().fetchTopicById(id);
          await get().fetchTopics();

          set({ isLoading: false });
        } catch (error: any) {
          console.error("更新话题失败:", error);
          set({ error: error.message || "更新话题失败", isLoading: false });
        }
      },

      deleteTopic: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // 调用 API 删除话题
          // 注意：你需要在 TopicService 中添加这个方法
          // const response = await TopicService.deleteTopic(id);

          // 从本地状态中移除话题
          const updatedTopics = get().topics.filter(t => t.id !== id);
          const updatedUserTopics = get().userTopics.filter(t => t.id !== id);
          const updatedLikedTopics = get().likedTopics.filter(t => t.id !== id);

          set({
            topics: updatedTopics,
            userTopics: updatedUserTopics,
            likedTopics: updatedLikedTopics,
            isLoading: false
          });

          if (get().currentTopic?.id === id) {
            set({ currentTopic: null });
          }

          get().applyFilters();
        } catch (error: any) {
          console.error("删除话题失败:", error);
          set({ error: error.message || "删除话题失败", isLoading: false });
        }
      },

      likeTopic: async (id: string) => {
        try {
          // 获取当前话题状态
          const topics = get().topics;
          const topicIndex = topics.findIndex(t => t.id === id);

          if (topicIndex === -1) return;

          const topic = topics[topicIndex];
          const isLiked = !topic.isLiked;
          const likesCount = isLiked ? topic.likesCount + 1 : topic.likesCount - 1;

          // 立即更新 UI 状态
          const updatedTopic = {
            ...topic,
            isLiked,
            likesCount,
          };

          const updatedTopics = [...topics];
          updatedTopics[topicIndex] = updatedTopic;

          set({ topics: updatedTopics });

          // 更新 userTopics 如果需要
          const { userTopics } = get();
          if (userTopics.length > 0) {
            const userTopicIndex = userTopics.findIndex(t => t.id === id);
            if (userTopicIndex !== -1) {
              const updatedUserTopics = [...userTopics];
              updatedUserTopics[userTopicIndex] = updatedTopic;
              set({ userTopics: updatedUserTopics });
            }
          }

          // 更新 likedTopics 如果需要
          const { likedTopics } = get();
          if (likedTopics.length > 0) {
            if (isLiked) {
              // 如果是点赞，添加到 likedTopics
              if (!likedTopics.some(t => t.id === id)) {
                set({ likedTopics: [updatedTopic, ...likedTopics] });
              } else {
                // 更新已存在的
                const likedTopicIndex = likedTopics.findIndex(t => t.id === id);
                const updatedLikedTopics = [...likedTopics];
                updatedLikedTopics[likedTopicIndex] = updatedTopic;
                set({ likedTopics: updatedLikedTopics });
              }
            } else {
              // 如果是取消点赞，从 likedTopics 中移除
              const updatedLikedTopics = likedTopics.filter(t => t.id !== id);
              set({ likedTopics: updatedLikedTopics });
            }
          }

          if (get().currentTopic?.id === id) {
            set({ currentTopic: updatedTopic });
          }

          // 应用过滤器
          get().applyFilters();

          // 调用 API 进行点赞/取消点赞
          await TopicService.likeTopic(id);
        } catch (error: any) {
          console.error("话题点赞操作失败:", error);
          // 点赞失败，可考虑恢复原状态
        }
      },

      setFilter: (filter: Partial<TopicFilter>) => {
        set({ filter: { ...get().filter, ...filter } });
        get().applyFilters();
      },

      applyFilters: () => {
        const { topics, filter } = get();
        let filtered = [...topics];

        // 应用搜索过滤
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          filtered = filtered.filter(
            topic =>
              topic.title.toLowerCase().includes(searchLower) ||
              topic.content.toLowerCase().includes(searchLower) ||
              (topic.tags && Array.isArray(topic.tags) &&
                topic.tags.some(tag => tag.toLowerCase().includes(searchLower)))
          );
        }

        // 应用标签过滤
        if (filter.tags && filter.tags.length > 0) {
          filtered = filtered.filter(
            topic => topic.tags && Array.isArray(topic.tags) && topic.tags.length > 0 &&
              filter.tags!.some(tag => topic.tags.includes(tag))
          );
        }

        // 应用距离过滤
        if (filter.distance) {
          filtered = filtered.filter(
            topic => topic.distance !== undefined && topic.distance <= filter.distance!
          );
        }

        // 应用排序
        if (filter.sort) {
          switch (filter.sort) {
            case 'recent':
              filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              break;
            case 'popular':
              filtered.sort((a, b) => b.likesCount - a.likesCount);
              break;
            case 'distance':
              filtered.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
              break;
          }
        }

        set({ filteredTopics: filtered });
      },
    }),
    {
      name: 'topic-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        filter: state.filter,
      }),
    }
  )
);