import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Topic, CreateTopicPayload, TopicFilter } from '@/types/topic';
import { useAuthStore } from './auth-store';

// Mock topics for demo
const mockTopics: Topic[] = [
  {
    id: '1',
    title: 'Best coffee shops in downtown',
    content: "I'm looking for recommendations on coffee shops with good wifi for working remotely. Any suggestions?",
    author: {
      id: '1',
      email: 'john@example.com',
      username: 'johndoe',
      displayName: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
      createdAt: new Date(2023, 1, 15).toISOString(),
      updatedAt: new Date(2023, 5, 20).toISOString(),
      followersCount: 245,
      followingCount: 178,
      topicsCount: 32,
      type: 'person',
      likesCount: 120,
      lastActiveAt: new Date(2023, 6, 10).toISOString(),
    },
    authorId: '1',
    images: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
    ],
    tags: ['coffee', 'work', 'wifi'],
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: 'Union Square, San Francisco, CA',
    },
    distance: 0.5,
    createdAt: new Date(2023, 6, 15).toISOString(),
    updatedAt: new Date(2023, 6, 15).toISOString(),
    likesCount: 24,
    commentsCount: 8,
    isLiked: false,
  },
  {
    id: '2',
    title: 'Hiking trail recommendations',
    content: "Planning a weekend hike. What are some good trails within 30 minutes of the city?",
    author: {
      id: '2',
      email: 'jane@example.com',
      username: 'janesmith',
      displayName: 'Jane Smith',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      createdAt: new Date(2023, 2, 10).toISOString(),
      updatedAt: new Date(2023, 6, 5).toISOString(),
      followersCount: 532,
      followingCount: 215,
      topicsCount: 47,
      type: 'person',
      likesCount: 350,
      lastActiveAt: new Date(2023, 6, 12).toISOString(),
    },
    authorId: '2',
    images: [
      'https://images.unsplash.com/photo-1551632811-561732d1e306',
      'https://images.unsplash.com/photo-1527201987695-67c06571957e',
    ],
    tags: ['hiking', 'outdoors', 'weekend'],
    location: {
      latitude: 37.8199,
      longitude: -122.4783,
      address: 'Golden Gate Park, San Francisco, CA',
    },
    distance: 2.3,
    createdAt: new Date(2023, 6, 14).toISOString(),
    updatedAt: new Date(2023, 6, 14).toISOString(),
    likesCount: 42,
    commentsCount: 15,
    isLiked: true,
  },
  {
    id: '3',
    title: 'Food truck festival this weekend',
    content: "There's a food truck festival happening at the park this weekend. Over 20 different cuisines to try!",
    author: {
      id: '1',
      email: 'john@example.com',
      username: 'johndoe',
      displayName: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
      createdAt: new Date(2023, 1, 15).toISOString(),
      updatedAt: new Date(2023, 5, 20).toISOString(),
      followersCount: 245,
      followingCount: 178,
      topicsCount: 32,
      type: 'person',
      likesCount: 120,
      lastActiveAt: new Date(2023, 6, 10).toISOString(),
    },
    authorId: '1',
    images: [
      'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
    ],
    tags: ['food', 'festival', 'weekend'],
    location: {
      latitude: 37.7694,
      longitude: -122.4862,
      address: 'Golden Gate Park, Conservatory of Flowers, San Francisco, CA',
    },
    distance: 1.8,
    expiresAt: new Date(2023, 6, 18).toISOString(),
    createdAt: new Date(2023, 6, 13).toISOString(),
    updatedAt: new Date(2023, 6, 13).toISOString(),
    likesCount: 67,
    commentsCount: 23,
    isLiked: false,
  },
  {
    id: '4',
    title: 'Tech meetup for mobile developers',
    content: "Hosting a casual meetup for mobile developers to network and share ideas. All experience levels welcome!",
    author: {
      id: '2',
      email: 'jane@example.com',
      username: 'janesmith',
      displayName: 'Jane Smith',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      createdAt: new Date(2023, 2, 10).toISOString(),
      updatedAt: new Date(2023, 6, 5).toISOString(),
      followersCount: 532,
      followingCount: 215,
      topicsCount: 47,
      type: 'person',
      likesCount: 350,
      lastActiveAt: new Date(2023, 6, 12).toISOString(),
    },
    authorId: '2',
    images: [
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b',
    ],
    tags: ['tech', 'meetup', 'developers', 'networking'],
    location: {
      latitude: 37.7833,
      longitude: -122.4167,
      address: 'SoMa, San Francisco, CA',
    },
    distance: 3.1,
    createdAt: new Date(2023, 6, 12).toISOString(),
    updatedAt: new Date(2023, 6, 12).toISOString(),
    likesCount: 31,
    commentsCount: 12,
    isLiked: false,
  },
  {
    id: '5',
    title: 'Farmers market this Saturday',
    content: "The weekly farmers market is happening this Saturday from 8am-1pm. Fresh produce, baked goods, and more!",
    author: {
      id: '1',
      email: 'john@example.com',
      username: 'johndoe',
      displayName: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
      createdAt: new Date(2023, 1, 15).toISOString(),
      updatedAt: new Date(2023, 5, 20).toISOString(),
      followersCount: 245,
      followingCount: 178,
      topicsCount: 32,
      type: 'person',
      likesCount: 120,
      lastActiveAt: new Date(2023, 6, 10).toISOString(),
    },
    authorId: '1',
    images: [
      'https://images.unsplash.com/photo-1488459716781-31db52582fe9',
      'https://images.unsplash.com/photo-1542838132-92c53300491e',
    ],
    tags: ['market', 'food', 'local', 'shopping'],
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: 'Ferry Building Marketplace, San Francisco, CA',
    },
    distance: 1.2,
    expiresAt: new Date(2023, 6, 17).toISOString(),
    createdAt: new Date(2023, 6, 11).toISOString(),
    updatedAt: new Date(2023, 6, 11).toISOString(),
    likesCount: 45,
    commentsCount: 8,
    isLiked: true,
  },
];

// Generate more mock topics for pagination demo
const generateMoreMockTopics = (page: number, pageSize: number = 5): Topic[] => {
  const startId = mockTopics.length + 1 + (page - 1) * pageSize;
  const newTopics: Topic[] = [];
  
  // Sample addresses for generated topics
  const sampleAddresses = [
    'Mission District, San Francisco, CA',
    'North Beach, San Francisco, CA',
    'Hayes Valley, San Francisco, CA',
    'Chinatown, San Francisco, CA',
    'Fisherman\'s Wharf, San Francisco, CA',
    'Japantown, San Francisco, CA',
    'Nob Hill, San Francisco, CA',
    'Russian Hill, San Francisco, CA',
    'Haight-Ashbury, San Francisco, CA',
    'Castro District, San Francisco, CA'
  ];
  
  for (let i = 0; i < pageSize; i++) {
    const id = String(startId + i);
    const authorId = Math.random() > 0.5 ? '1' : '2';
    const author = mockTopics.find(t => t.authorId === authorId)?.author!;
    const addressIndex = Math.floor(Math.random() * sampleAddresses.length);
    
    newTopics.push({
      id,
      title: `Generated Topic ${id}`,
      content: `This is auto-generated content for topic ${id}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      author,
      authorId,
      images: i % 2 === 0 ? ['https://images.unsplash.com/photo-1523240795612-9a054b0db644'] : [],
      tags: [`tag${i}`, 'generated', i % 3 === 0 ? 'featured' : 'regular'],
      location: {
        latitude: 37.7749 + (Math.random() * 0.1 - 0.05),
        longitude: -122.4194 + (Math.random() * 0.1 - 0.05),
        address: sampleAddresses[addressIndex],
      },
      distance: Math.random() * 5,
      createdAt: new Date(2023, 6, 10 - i).toISOString(),
      updatedAt: new Date(2023, 6, 10 - i).toISOString(),
      likesCount: Math.floor(Math.random() * 100),
      commentsCount: Math.floor(Math.random() * 30),
      isLiked: Math.random() > 0.7,
    });
  }
  
  return newTopics;
};

interface TopicState {
  topics: Topic[];
  filteredTopics: Topic[];
  userTopics: Topic[]; // Added explicit userTopics array
  likedTopics: Topic[]; // Added likedTopics array
  currentTopic: Topic | null;
  isLoading: boolean;
  isLikedTopicsLoading: boolean; // Added loading state for liked topics
  error: string | null;
  filter: TopicFilter;
  currentPage: number;
  hasMoreTopics: boolean;
}

type TopicStore = TopicState & {
  fetchTopics: () => Promise<void>;
  fetchUserTopics: (userId: string) => Promise<void>;
  fetchLikedTopics: (userId: string) => Promise<void>; // Added function to fetch liked topics
  fetchTopicById: (id: string) => Promise<void>;
  createTopic: (topic: CreateTopicPayload) => Promise<void>;
  updateTopic: (id: string, topic: Partial<CreateTopicPayload>) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  likeTopic: (id: string) => Promise<void>;
  setFilter: (filter: Partial<TopicFilter>) => void;
  applyFilters: () => void;
  loadMoreTopics: () => Promise<void>;
};

export const useTopicStore = create<TopicStore>()(
  persist(
    (set, get) => ({
      topics: mockTopics,
      filteredTopics: mockTopics,
      userTopics: [], // Initialize as empty array
      likedTopics: [], // Initialize as empty array
      currentTopic: null,
      isLoading: false,
      isLikedTopicsLoading: false, // Initialize as false
      error: null,
      filter: {
        sort: 'recent',
      },
      currentPage: 1,
      hasMoreTopics: true,

      fetchTopics: async () => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // In a real app, we would fetch from an API
          set({ 
            topics: mockTopics, 
            filteredTopics: mockTopics, 
            isLoading: false,
            currentPage: 1,
            hasMoreTopics: true
          });
          get().applyFilters();
        } catch (error) {
          set({ error: "Failed to fetch topics", isLoading: false });
        }
      },

      fetchUserTopics: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Filter topics by user ID
          const userTopics = mockTopics.filter(topic => topic.authorId === userId);
          
          set({ 
            userTopics, 
            isLoading: false 
          });
        } catch (error) {
          console.error("Failed to fetch user topics:", error);
          set({ 
            error: "Failed to fetch user topics", 
            isLoading: false,
            userTopics: [] // Ensure userTopics is always an array even on error
          });
        }
      },

      fetchLikedTopics: async (userId: string) => {
        set({ isLikedTopicsLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Filter topics that are liked
          // In a real app, you would fetch this from an API
          const likedTopics = mockTopics.filter(topic => topic.isLiked);
          
          // Add some random liked topics for demo purposes
          const extraLikedTopics = generateMoreMockTopics(1, 3).map(topic => ({
            ...topic,
            isLiked: true
          }));
          
          set({ 
            likedTopics: [...likedTopics, ...extraLikedTopics], 
            isLikedTopicsLoading: false 
          });
        } catch (error) {
          console.error("Failed to fetch liked topics:", error);
          set({ 
            error: "Failed to fetch liked topics", 
            isLikedTopicsLoading: false,
            likedTopics: [] // Ensure likedTopics is always an array even on error
          });
        }
      },

      loadMoreTopics: async () => {
        const { currentPage, filter } = get();
        const nextPage = currentPage + 1;
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Generate more mock topics
          const newTopics = generateMoreMockTopics(nextPage);
          
          // If we have less than the page size, there are no more topics
          const hasMore = newTopics.length === 5;
          
          set(state => ({
            topics: [...state.topics, ...newTopics],
            currentPage: nextPage,
            hasMoreTopics: hasMore
          }));
          
          get().applyFilters();
        } catch (error) {
          console.error("Failed to load more topics", error);
        }
      },

      fetchTopicById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const topic = get().topics.find(t => t.id === id);
          
          if (topic) {
            set({ currentTopic: topic, isLoading: false });
          } else {
            set({ error: "Topic not found", isLoading: false });
          }
        } catch (error) {
          set({ error: "Failed to fetch topic", isLoading: false });
        }
      },

      createTopic: async (topicData: CreateTopicPayload) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const user = useAuthStore.getState().user;
          
          if (!user) {
            set({ error: "Not authenticated", isLoading: false });
            return;
          }
          
          const newTopic: Topic = {
            id: String(get().topics.length + 1),
            title: topicData.title,
            content: topicData.content,
            author: user,
            authorId: user.id,
            images: topicData.images,
            tags: topicData.tags,
            location: topicData.location,
            expiresAt: topicData.expiresAt,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            likesCount: 0,
            commentsCount: 0,
            isLiked: false,
          };
          
          // In a real app, we would save this to the backend
          const updatedTopics = [newTopic, ...get().topics];
          set({ topics: updatedTopics, isLoading: false });
          
          // Update userTopics if the new topic belongs to the current user
          const { userTopics } = get();
          if (userTopics.length > 0) {
            set({ userTopics: [newTopic, ...userTopics] });
          }
          
          get().applyFilters();
        } catch (error) {
          set({ error: "Failed to create topic", isLoading: false });
        }
      },

      updateTopic: async (id: string, topicData: Partial<CreateTopicPayload>) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const topics = get().topics;
          const topicIndex = topics.findIndex(t => t.id === id);
          
          if (topicIndex === -1) {
            set({ error: "Topic not found", isLoading: false });
            return;
          }
          
          const updatedTopic = {
            ...topics[topicIndex],
            ...topicData,
            updatedAt: new Date().toISOString(),
          };
          
          const updatedTopics = [...topics];
          updatedTopics[topicIndex] = updatedTopic;
          
          set({ topics: updatedTopics, isLoading: false });
          
          // Update userTopics if needed
          const { userTopics } = get();
          if (userTopics.length > 0) {
            const userTopicIndex = userTopics.findIndex(t => t.id === id);
            if (userTopicIndex !== -1) {
              const updatedUserTopics = [...userTopics];
              updatedUserTopics[userTopicIndex] = updatedTopic;
              set({ userTopics: updatedUserTopics });
            }
          }
          
          // Update likedTopics if needed
          const { likedTopics } = get();
          if (likedTopics.length > 0) {
            const likedTopicIndex = likedTopics.findIndex(t => t.id === id);
            if (likedTopicIndex !== -1) {
              const updatedLikedTopics = [...likedTopics];
              updatedLikedTopics[likedTopicIndex] = updatedTopic;
              set({ likedTopics: updatedLikedTopics });
            }
          }
          
          if (get().currentTopic?.id === id) {
            set({ currentTopic: updatedTopic });
          }
          
          get().applyFilters();
        } catch (error) {
          set({ error: "Failed to update topic", isLoading: false });
        }
      },

      deleteTopic: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const updatedTopics = get().topics.filter(t => t.id !== id);
          set({ topics: updatedTopics, isLoading: false });
          
          // Update userTopics if needed
          const { userTopics } = get();
          if (userTopics.length > 0) {
            const updatedUserTopics = userTopics.filter(t => t.id !== id);
            set({ userTopics: updatedUserTopics });
          }
          
          // Update likedTopics if needed
          const { likedTopics } = get();
          if (likedTopics.length > 0) {
            const updatedLikedTopics = likedTopics.filter(t => t.id !== id);
            set({ likedTopics: updatedLikedTopics });
          }
          
          if (get().currentTopic?.id === id) {
            set({ currentTopic: null });
          }
          
          get().applyFilters();
        } catch (error) {
          set({ error: "Failed to delete topic", isLoading: false });
        }
      },

      likeTopic: async (id: string) => {
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const topics = get().topics;
          const topicIndex = topics.findIndex(t => t.id === id);
          
          if (topicIndex === -1) return;
          
          const topic = topics[topicIndex];
          const isLiked = !topic.isLiked;
          const likesCount = isLiked ? topic.likesCount + 1 : topic.likesCount - 1;
          
          const updatedTopic = {
            ...topic,
            isLiked,
            likesCount,
          };
          
          const updatedTopics = [...topics];
          updatedTopics[topicIndex] = updatedTopic;
          
          set({ topics: updatedTopics });
          
          // Update userTopics if needed
          const { userTopics } = get();
          if (userTopics.length > 0) {
            const userTopicIndex = userTopics.findIndex(t => t.id === id);
            if (userTopicIndex !== -1) {
              const updatedUserTopics = [...userTopics];
              updatedUserTopics[userTopicIndex] = updatedTopic;
              set({ userTopics: updatedUserTopics });
            }
          }
          
          // Update likedTopics if needed
          const { likedTopics } = get();
          if (likedTopics.length > 0) {
            if (isLiked) {
              // Add to liked topics if not already there
              if (!likedTopics.some(t => t.id === id)) {
                set({ likedTopics: [updatedTopic, ...likedTopics] });
              } else {
                // Update existing liked topic
                const likedTopicIndex = likedTopics.findIndex(t => t.id === id);
                const updatedLikedTopics = [...likedTopics];
                updatedLikedTopics[likedTopicIndex] = updatedTopic;
                set({ likedTopics: updatedLikedTopics });
              }
            } else {
              // Remove from liked topics
              const updatedLikedTopics = likedTopics.filter(t => t.id !== id);
              set({ likedTopics: updatedLikedTopics });
            }
          }
          
          if (get().currentTopic?.id === id) {
            set({ currentTopic: updatedTopic });
          }
          
          get().applyFilters();
        } catch (error) {
          console.error("Failed to like topic", error);
        }
      },

      setFilter: (filter: Partial<TopicFilter>) => {
        set({ filter: { ...get().filter, ...filter } });
        get().applyFilters();
      },

      applyFilters: () => {
        const { topics, filter } = get();
        let filtered = [...topics];
        
        // Apply search filter
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          filtered = filtered.filter(
            topic => 
              topic.title.toLowerCase().includes(searchLower) ||
              topic.content.toLowerCase().includes(searchLower) ||
              topic.tags.some(tag => tag.toLowerCase().includes(searchLower))
          );
        }
        
        // Apply tag filter
        if (filter.tags && filter.tags.length > 0) {
          filtered = filtered.filter(
            topic => filter.tags!.some(tag => topic.tags.includes(tag))
          );
        }
        
        // Apply distance filter
        if (filter.distance) {
          filtered = filtered.filter(
            topic => topic.distance !== undefined && topic.distance <= filter.distance!
          );
        }
        
        // Apply sorting
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
        topics: state.topics,
        filter: state.filter,
        currentPage: state.currentPage,
      }),
    }
  )
);