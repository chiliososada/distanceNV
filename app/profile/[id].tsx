import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  ChevronLeft, 
  MessageCircle, 
  MapPin, 
  MoreHorizontal,
  Heart,
  UserPlus,
  UserMinus,
  Share2,
  Flag,
  Bell,
  BellOff
} from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { TopicCard } from '@/components/TopicCard';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { useTopicStore } from '@/store/topic-store';
import { useChatStore } from '@/store/chat-store';

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { topics, fetchTopics } = useTopicStore();
  const { createChat } = useChatStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('topics');
  const [refreshing, setRefreshing] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  // For demo purposes, we'll use mock data
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user from mock data
      const mockUsers = [
        {
          id: '1',
          type: 'person',
          email: 'john@example.com',
          username: 'johndoe',
          displayName: 'John Doe',
          bio: 'Software developer and hiking enthusiast',
          avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
          location: {
            latitude: 37.7749,
            longitude: -122.4194,
            address: 'San Francisco, CA',
          },
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
          bio: 'Photographer and travel lover',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
          location: {
            latitude: 34.0522,
            longitude: -118.2437,
            address: 'Los Angeles, CA',
          },
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
          bio: 'Specialty coffee and pastries in a cozy environment',
          avatar: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
          businessName: 'Artisan Coffee House',
          businessCategory: 'Café',
          businessHours: 'Mon-Fri: 7am-7pm, Sat-Sun: 8am-6pm',
          businessPhone: '(415) 555-1234',
          businessWebsite: 'www.artisancoffeehouse.com',
          location: {
            latitude: 37.7831,
            longitude: -122.4159,
            address: '123 Market St, San Francisco, CA',
          },
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
          bio: 'Independent bookstore with rare finds and cozy reading nooks',
          avatar: 'https://images.unsplash.com/photo-1526243741027-444d633d7365',
          businessName: 'Corner Bookstore',
          businessCategory: 'Bookstore',
          businessHours: 'Daily: 10am-8pm',
          businessPhone: '(415) 555-5678',
          businessWebsite: 'www.cornerbookstore.com',
          location: {
            latitude: 37.7831,
            longitude: -122.4159,
            address: '456 Valencia St, San Francisco, CA',
          },
          followersCount: 356,
          followingCount: 42,
          topicsCount: 63,
        },
      ];
      
      const foundUser = mockUsers.find(u => u.id === id);
      
      if (foundUser) {
        setProfileUser(foundUser);
        // Random follow state for demo
        setIsFollowing(Math.random() > 0.5);
      }
      
      setIsLoading(false);
    };
    
    if (id) {
      loadProfile();
      fetchTopics();
    }
  }, [id]);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTopics();
    setRefreshing(false);
  };
  
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    
    if (isFollowing) {
      // Unfollow logic
      setProfileUser({
        ...profileUser,
        followersCount: profileUser.followersCount - 1,
      });
    } else {
      // Follow logic
      setProfileUser({
        ...profileUser,
        followersCount: profileUser.followersCount + 1,
      });
    }
  };
  
  const handleMessage = async () => {
    if (!profileUser) return;
    
    try {
      const chatId = await createChat({
        isGroup: false,
        participants: [profileUser.id],
      });
      
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert("Error", "Failed to create chat. Please try again.");
    }
  };

  const handleOptionsPress = () => {
    setShowOptionsMenu(!showOptionsMenu);
  };

  const handleShare = () => {
    Alert.alert("Share", "Profile sharing functionality would be implemented here");
    setShowOptionsMenu(false);
  };

  const handleReport = () => {
    Alert.alert(
      "Report User",
      "Are you sure you want to report this user?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Report", 
          onPress: () => Alert.alert("Report Submitted", "Thank you for your report. We'll review it shortly.") 
        }
      ]
    );
    setShowOptionsMenu(false);
  };

  const handleMute = () => {
    Alert.alert("Notifications Muted", "You won't receive notifications about this user");
    setShowOptionsMenu(false);
  };

  const handleUnmute = () => {
    Alert.alert("Notifications Unmuted", "You will now receive notifications about this user");
    setShowOptionsMenu(false);
  };
  
  // Filter topics by profile user
  const userTopics = topics.filter(topic => topic.authorId === id);
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'topics':
        return (
          <View style={styles.topicsContainer}>
            {refreshing && (
              <ActivityIndicator 
                size="small" 
                color={colors.primary} 
                style={{marginBottom: 10}} 
              />
            )}
            
            {userTopics.length > 0 ? (
              userTopics.map((item, index) => (
                <TopicCard 
                  key={`topic-${item.id}-${index}`}
                  topic={item} 
                  onPress={() => router.push(`/topic/${item.id}`)}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No topics yet</Text>
                <Text style={styles.emptyText}>
                  This user hasn't posted any topics yet
                </Text>
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };
  
  if (isLoading || !profileUser) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }
  
  const isCurrentUser = user?.id === id;
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: profileUser.displayName,
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleOptionsPress}
            >
              <MoreHorizontal size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      {showOptionsMenu && (
        <View style={styles.optionsMenu}>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={handleShare}
          >
            <Share2 size={20} color={colors.text} />
            <Text style={styles.optionText}>Share Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={handleMute}
          >
            <BellOff size={20} color={colors.text} />
            <Text style={styles.optionText}>Mute Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={handleUnmute}
          >
            <Bell size={20} color={colors.text} />
            <Text style={styles.optionText}>Unmute Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={handleReport}
          >
            <Flag size={20} color={colors.warning} />
            <Text style={[styles.optionText, styles.reportText]}>Report User</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar style="dark" />
        
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.profileHeader}>
            <Avatar 
              source={profileUser.avatar} 
              name={profileUser.displayName} 
              size="large" 
              borderColor={colors.background}
            />
            
            <Text style={styles.displayName}>{profileUser.displayName}</Text>
            <Text style={styles.username}>@{profileUser.username}</Text>
            
            {profileUser.location && (
              <View style={styles.locationContainer}>
                <MapPin size={14} color={colors.textSecondary} />
                <Text style={styles.locationText}>
                  {profileUser.location.address || 'Location set'}
                </Text>
              </View>
            )}
            
            {profileUser.bio && (
              <Text style={styles.bio}>{profileUser.bio}</Text>
            )}
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profileUser.topicsCount}</Text>
                <Text style={styles.statLabel}>Topics</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profileUser.followersCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profileUser.followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
            
            {!isCurrentUser && (
              <View style={styles.actionButtons}>
                <Button
                  title={isFollowing ? "Unfollow" : "Follow"}
                  onPress={handleFollow}
                  variant={isFollowing ? "outline" : "primary"}
                  size="small"
                  style={styles.actionButton}
                  icon={isFollowing ? 
                    <UserMinus size={18} color={colors.primary} /> : 
                    <UserPlus size={18} color="white" />
                  }
                />
                <Button
                  title="Message"
                  onPress={handleMessage}
                  variant="secondary"
                  size="small"
                  style={styles.actionButton}
                  icon={<MessageCircle size={18} color="white" />}
                />
              </View>
            )}
          </View>
          
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'topics' && styles.activeTabButton
              ]}
              onPress={() => setActiveTab('topics')}
            >
              <MessageCircle 
                size={20} 
                color={activeTab === 'topics' ? colors.primary : colors.textSecondary} 
              />
              <Text style={[
                styles.tabText,
                activeTab === 'topics' && styles.activeTabText
              ]}>
                Topics
              </Text>
            </TouchableOpacity>
          </View>
          
          {renderTabContent()}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerButton: {
    padding: 8,
  },
  optionsMenu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  reportText: {
    color: colors.warning,
  },
  profileHeader: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  bio: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.border,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    minWidth: 120,
    marginHorizontal: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  topicsContainer: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});