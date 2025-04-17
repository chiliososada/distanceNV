import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  Settings, 
  Edit, 
  MapPin, 
  Calendar, 
  Users, 
  MessageSquare,
  Share2,
  Heart,
  Eye,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Trash2,
  PenLine,
  QrCode
} from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { TopicCard } from '@/components/TopicCard';
import { Button } from '@/components/Button';
import { ProfileQRCode } from '@/components/ProfileQRCode';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { useTopicStore } from '@/store/topic-store';
import { formatDate } from '@/utils/date';
import { Topic } from '@/types/topic';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isInitializing } = useAuthStore();
  const { 
    fetchUserTopics, 
    fetchLikedTopics,
    userTopics, 
    likedTopics,
    isLoading: isTopicsLoading,
    isLikedTopicsLoading,
    deleteTopic,
    likeTopic
  } = useTopicStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('topics');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [qrCodeVisible, setQrCodeVisible] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchUserTopics(user.id);
    }
  }, [user]);
  
  // Fetch liked topics when the likes tab is selected
  useEffect(() => {
    if (user && activeTab === 'likes') {
      fetchLikedTopics(user.id);
    }
  }, [user, activeTab]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    if (user) {
      if (activeTab === 'topics') {
        await fetchUserTopics(user.id);
      } else if (activeTab === 'likes') {
        await fetchLikedTopics(user.id);
      }
    }
    setRefreshing(false);
  };
  
  const handleEditProfile = () => {
    router.push('/profile/edit');
  };
  
  const handleSettings = () => {
    router.push('/settings');
  };
  
  const handleCreateTopic = () => {
    router.push('/create');
  };
  
  const handleTopicPress = (topicId: string) => {
    router.push(`/topic/${topicId}`);
  };
  
  const handleEditTopic = (topicId: string) => {
    router.push({
      pathname: '/create',
      params: { topicId }
    });
    setSelectedTopic(null);
  };
  
  const handleDeleteTopic = (topicId: string) => {
    Alert.alert(
      "Delete Topic",
      "Are you sure you want to delete this topic? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setSelectedTopic(null)
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTopic(topicId);
              Alert.alert("Success", "Topic deleted successfully");
              setSelectedTopic(null);
            } catch (error) {
              Alert.alert("Error", "Failed to delete topic");
              console.error(error);
            }
          }
        }
      ]
    );
  };
  
  const handleLikeTopic = (topicId: string) => {
    likeTopic(topicId);
  };
  
  const toggleTopicOptions = (topicId: string) => {
    setSelectedTopic(selectedTopic === topicId ? null : topicId);
  };
  
  const showQRCode = () => {
    setQrCodeVisible(true);
  };
  
  if (isInitializing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }
  
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notLoggedInContainer}>
          <Text style={styles.notLoggedInText}>
            Please log in to view your profile
          </Text>
          <Button 
            title="Log In" 
            onPress={() => router.push('/login')} 
            style={styles.loginButton}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  const renderTopicItem = (item: Topic, index: number, showOptions: boolean = true) => (
    <View key={`profile-topic-${item.id}-${index}`} style={styles.topicItemContainer}>
      <TopicCard 
        topic={item} 
        onPress={() => handleTopicPress(item.id)}
        showDistance={false}
        onLike={() => handleLikeTopic(item.id)}
      />
      
      {showOptions && (
        <TouchableOpacity 
          style={styles.topicOptionsButton}
          onPress={() => toggleTopicOptions(item.id)}
        >
          <MoreHorizontal size={20} color={colors.text} />
        </TouchableOpacity>
      )}
      
      {showOptions && selectedTopic === item.id && (
        <View style={styles.topicOptionsMenu}>
          <TouchableOpacity 
            style={styles.topicOptionItem}
            onPress={() => handleEditTopic(item.id)}
          >
            <PenLine size={18} color={colors.text} />
            <Text style={styles.topicOptionText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.topicOptionItem}
            onPress={() => handleDeleteTopic(item.id)}
          >
            <Trash2 size={18} color={colors.error} />
            <Text style={[styles.topicOptionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <Stack.Screen 
        options={{
          headerTitle: 'Profile',
          headerRight: () => (
            <TouchableOpacity onPress={handleSettings} style={styles.headerButton}>
              <Settings size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
          <View style={styles.avatarContainer}>
            <Avatar 
              source={user.avatar} 
              name={user.displayName} 
              size="large" 
            />
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Edit size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.displayName}>{user.displayName}</Text>
              <TouchableOpacity 
                style={styles.qrCodeButton}
                onPress={showQRCode}
              >
                <QrCode size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.username}>@{user.username}</Text>
            
            {user.type === 'business' && (
              <View style={styles.businessBadge}>
                <Text style={styles.businessBadgeText}>Business</Text>
              </View>
            )}
            
            {user.bio && (
              <Text style={styles.bio}>{user.bio}</Text>
            )}
            
            <View style={styles.profileMetaInfo}>
              {user.location?.address && (
                <View style={styles.metaItem}>
                  <MapPin size={14} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{user.location.address}</Text>
                </View>
              )}
              
              <View style={styles.metaItem}>
                <Calendar size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  Joined {formatDate(user.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.topicsCount || 0}</Text>
            <Text style={styles.statLabel}>Topics</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.followersCount || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.followingCount || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          
          {user.type === 'business' && (
            <>
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.viewCount || 0}</Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>
            </>
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
            <Text style={[
              styles.tabButtonText,
              activeTab === 'topics' && styles.activeTabButtonText
            ]}>
              Topics
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tabButton,
              activeTab === 'likes' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('likes')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'likes' && styles.activeTabButtonText
            ]}>
              Likes
            </Text>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'topics' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Topics</Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleCreateTopic}
              >
                <Plus size={16} color={colors.primary} />
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
            
            {isTopicsLoading ? (
              <ActivityIndicator 
                size="large" 
                color={colors.primary} 
                style={styles.loadingIndicator} 
              />
            ) : userTopics && userTopics.length > 0 ? (
              <View style={styles.topicsList}>
                {userTopics.map((item, index) => renderTopicItem(item, index))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>You haven't created any topics yet</Text>
                <Button 
                  title="Create Your First Topic" 
                  onPress={handleCreateTopic} 
                  style={styles.emptyButton}
                />
              </View>
            )}
          </>
        )}
        
        {activeTab === 'likes' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Liked Topics</Text>
            </View>
            
            {isLikedTopicsLoading ? (
              <ActivityIndicator 
                size="large" 
                color={colors.primary} 
                style={styles.loadingIndicator} 
              />
            ) : likedTopics && likedTopics.length > 0 ? (
              <View style={styles.topicsList}>
                {likedTopics.map((item, index) => renderTopicItem(item, index, false)
                )}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No liked topics yet</Text>
                <Text style={styles.emptySubtext}>
                  Topics you like will appear here
                </Text>
                <Button 
                  title="Explore Topics" 
                  onPress={() => router.push('/')} 
                  style={styles.emptyButton}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
      
      {user && (
        <ProfileQRCode
          user={user}
          visible={qrCodeVisible}
          onClose={() => setQrCodeVisible(false)}
        />
      )}
    </SafeAreaView>
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
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notLoggedInText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    width: 200,
  },
  headerButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  qrCodeButton: {
    padding: 8,
    marginLeft: 8,
  },
  username: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  businessBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  businessBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  bio: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  profileMetaInfo: {
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: colors.border,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  activeTabButtonText: {
    color: 'white',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  createButtonText: {
    marginLeft: 4,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  topicsList: {
    paddingHorizontal: 16,
  },
  topicItemContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  topicOptionsButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicOptionsMenu: {
    position: 'absolute',
    top: 44,
    right: 12,
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
  topicOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  topicOptionText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  deleteText: {
    color: colors.error,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 16,
  },
});