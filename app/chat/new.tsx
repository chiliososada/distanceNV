import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  ChevronLeft, 
  Search, 
  Users, 
  User, 
  Store, 
  CheckCircle 
} from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { useChatStore } from '@/store/chat-store';
import { UserProfile } from '@/types/user';

// Mock users for the new chat screen
const mockUsers: UserProfile[] = [
  {
    id: '2',
    type: 'person',
    email: 'jane@example.com',
    username: 'janesmith',
    displayName: 'Jane Smith',
    bio: 'Photographer and travel lover',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    location: {
      latitude: 34.0522,
      longitude: -118.2437,
      address: 'Los Angeles, CA',
    },
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
    username: 'mikesmith',
    displayName: 'Mike Smith',
    bio: 'Photographer and coffee enthusiast',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    location: {
      latitude: 37.7739,
      longitude: -122.4312,
      address: 'San Francisco, CA',
    },
    createdAt: new Date(2023, 3, 15).toISOString(),
    updatedAt: new Date(2023, 6, 10).toISOString(),
    followersCount: 156,
    followingCount: 89,
    topicsCount: 24,
  },
  {
    id: '4',
    type: 'business',
    email: 'info@coffeehouse.com',
    username: 'artisancoffee',
    displayName: 'Artisan Coffee House',
    businessName: 'Artisan Coffee House',
    bio: 'Specialty coffee and pastries in a cozy environment',
    avatar: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
    businessCategory: 'Café',
    location: {
      latitude: 37.7831,
      longitude: -122.4159,
      address: '123 Market St, San Francisco, CA',
    },
    createdAt: new Date(2022, 5, 10).toISOString(),
    updatedAt: new Date(2023, 6, 12).toISOString(),
    followersCount: 487,
    followingCount: 56,
    topicsCount: 78,
  },
  {
    id: '5',
    type: 'person',
    email: 'sarah@example.com',
    username: 'sarahjones',
    displayName: 'Sarah Jones',
    bio: 'Fitness instructor and health food lover',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    location: {
      latitude: 37.7831,
      longitude: -122.4159,
      address: 'San Francisco, CA',
    },
    createdAt: new Date(2023, 2, 5).toISOString(),
    updatedAt: new Date(2023, 6, 8).toISOString(),
    followersCount: 312,
    followingCount: 201,
    topicsCount: 45,
  },
  {
    id: '6',
    type: 'business',
    email: 'contact@bookstore.com',
    username: 'cornerbookstore',
    displayName: 'Corner Bookstore',
    businessName: 'Corner Bookstore',
    bio: 'Independent bookstore with rare finds and cozy reading nooks',
    avatar: 'https://images.unsplash.com/photo-1526243741027-444d633d7365',
    businessCategory: 'Bookstore',
    location: {
      latitude: 37.7831,
      longitude: -122.4159,
      address: '456 Valencia St, San Francisco, CA',
    },
    createdAt: new Date(2022, 8, 15).toISOString(),
    updatedAt: new Date(2023, 5, 20).toISOString(),
    followersCount: 356,
    followingCount: 42,
    topicsCount: 63,
  },
];

type ChatType = 'direct' | 'group';

export default function NewChatScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createChat, isLoading } = useChatStore();
  
  const [chatType, setChatType] = useState<ChatType>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  useEffect(() => {
    // Simulate loading users
    const timer = setTimeout(() => {
      setFilteredUsers(mockUsers);
      setLoadingUsers(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = mockUsers.filter(u => 
        u.displayName.toLowerCase().includes(query) || 
        u.username.toLowerCase().includes(query) ||
        (u.type === 'business' && u.businessName?.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(mockUsers);
    }
  }, [searchQuery]);
  
  const handleBack = () => {
    router.back();
  };
  
  const toggleUserSelection = (userId: string) => {
    if (chatType === 'direct' && selectedUsers.length > 0 && !selectedUsers.includes(userId)) {
      // For direct chats, only allow one selection
      setSelectedUsers([userId]);
    } else if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  
  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user');
      return;
    }
    
    if (chatType === 'group' && !groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    
    try {
      const chatId = await createChat({
        participants: selectedUsers,
        isGroup: chatType === 'group',
        name: chatType === 'group' ? groupName : undefined,
      });
      
      router.replace(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', 'Failed to create chat. Please try again.');
    }
  };
  
  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const isSelected = selectedUsers.includes(item.id);
    const isBusiness = item.type === 'business';
    
    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          isSelected && styles.selectedUserItem,
          isBusiness && styles.businessUserItem
        ]}
        onPress={() => toggleUserSelection(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.userItemContent}>
          <Avatar 
            source={item.avatar} 
            name={item.displayName} 
            size="medium" 
          />
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {isBusiness ? item.businessName : item.displayName}
            </Text>
            <Text style={styles.userUsername}>
              @{item.username}
            </Text>
          </View>
        </View>
        
        <View style={styles.checkboxContainer}>
          {isSelected ? (
            <CheckCircle size={24} color={colors.primary} fill={colors.primary} />
          ) : (
            <View style={styles.checkbox} />
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'New Chat',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar style="dark" />
        
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, chatType === 'direct' && styles.activeTypeButton]}
            onPress={() => setChatType('direct')}
          >
            <User 
              size={20} 
              color={chatType === 'direct' ? colors.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.typeText,
              chatType === 'direct' && styles.activeTypeText
            ]}>
              Direct Message
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.typeButton, chatType === 'group' && styles.activeTypeButton]}
            onPress={() => setChatType('group')}
          >
            <Users 
              size={20} 
              color={chatType === 'group' ? colors.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.typeText,
              chatType === 'group' && styles.activeTypeText
            ]}>
              Group Chat
            </Text>
          </TouchableOpacity>
        </View>
        
        {chatType === 'group' && (
          <View style={styles.groupNameContainer}>
            <Text style={styles.groupNameLabel}>Group Name</Text>
            <TextInput
              style={styles.groupNameInput}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name"
              placeholderTextColor={colors.textLight}
            />
          </View>
        )}
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search users"
              placeholderTextColor={colors.textLight}
            />
          </View>
        </View>
        
        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>
            {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'} selected
          </Text>
        </View>
        
        {loadingUsers ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.userList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            }
          />
        )}
        
        <View style={styles.footer}>
          <Button
            title={chatType === 'direct' ? 'Start Conversation' : 'Create Group'}
            onPress={handleCreateChat}
            loading={isLoading}
            fullWidth
            disabled={selectedUsers.length === 0 || (chatType === 'group' && !groupName.trim())}
          />
        </View>
      </SafeAreaView>
    </>
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
  typeSelector: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.card,
  },
  activeTypeButton: {
    backgroundColor: colors.primaryLight,
  },
  typeText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  activeTypeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  groupNameContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupNameLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: colors.text,
  },
  selectedCount: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedCountText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userList: {
    paddingBottom: 80,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedUserItem: {
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
  },
  businessUserItem: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});