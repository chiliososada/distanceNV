import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  Edit, 
  Search, 
  Filter, 
  Plus,
  ChevronRight
} from 'lucide-react-native';
import { ChatItem } from '@/components/ChatItem';
import { SearchBar } from '@/components/SearchBar';
import { colors } from '@/constants/colors';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { Chat } from '@/types/chat';

// Simplified chat categories
const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'private', name: 'Private' },
  { id: 'group', name: 'Group' },
  { id: 'business', name: 'Business' },
];

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    chats, 
    fetchChats, 
    isLoading, 
    error 
  } = useChatStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  useEffect(() => {
    fetchChats();
  }, []);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };
  
  const handleChatPress = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };
  
  const handleNewChat = () => {
    router.push('/chat/new');
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const filteredChats = chats
    .filter((chat: Chat) => {
      // Filter by search query
      if (searchQuery) {
        const otherParticipant = chat.participants.find(p => p.id !== user?.id);
        const matchesName = otherParticipant?.displayName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLastMessage = chat.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesName || matchesLastMessage;
      }
      return true;
    })
    .filter((chat: Chat) => {
      // Filter by simplified category
      switch (selectedCategory) {
        case 'private':
          return !chat.isGroup && !chat.participants.some(p => p.type === 'business' && p.id !== user?.id);
        case 'group':
          return chat.isGroup;
        case 'business':
          return chat.participants.some(p => p.type === 'business' && p.id !== user?.id);
        default:
          return true;
      }
    });
  
  // Render content based on state
  const renderContent = () => {
    if (isLoading && !refreshing) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (filteredChats.length === 0) {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            {searchQuery 
              ? "No messages match your search" 
              : "Start a conversation with someone"}
          </Text>
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={handleNewChat}
          >
            <Plus size={20} color="white" />
            <Text style={styles.newChatButtonText}>New Message</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <FlatList
        data={filteredChats}
        keyExtractor={(item: Chat) => item.id}
        renderItem={({ item }: { item: Chat }) => (
          <ChatItem
            chat={item}
            onPress={() => handleChatPress(item.id)}
            currentUserId={user?.id}
          />
        )}
        contentContainerStyle={styles.chatsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <Stack.Screen 
        options={{
          headerTitle: 'Messages',
          headerRight: () => (
            <TouchableOpacity onPress={handleNewChat} style={styles.headerButton}>
              <Edit size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={handleSearch}
          onClear={() => setSearchQuery('')}
        />
      </View>
      
      <View style={styles.categoriesWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.selectedCategoryButton,
                category.id === 'group' && selectedCategory === category.id && styles.selectedGroupButton
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.selectedCategoryText
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.contentWrapper}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoriesWrapper: {
    marginBottom: 0, // Consistent spacing after categories
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8, // Consistent bottom padding
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    marginRight: 8,
    height: 32,
    justifyContent: 'center',
  },
  selectedCategoryButton: {
    backgroundColor: colors.primary,
  },
  selectedGroupButton: {
    backgroundColor: colors.groupPrimary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: 'white',
  },
  contentWrapper: {
    flex: 1, // Take remaining space
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  chatsList: {
    flexGrow: 1,
  },
});