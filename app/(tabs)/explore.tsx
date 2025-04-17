import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Search,
  MapPin,
  Users,
  Store,
  Heart,
  MessageCircle,
  Clock,
  Eye,
  Filter
} from 'lucide-react-native';
import { SearchBar } from '@/components/SearchBar';
import { TopicCard } from '@/components/TopicCard';
import { Avatar } from '@/components/Avatar';
import { colors } from '@/constants/colors';
import { useTopicStore } from '@/store/topic-store';
import { NearbyUser, UserProfile } from '@/types/user';
import { getRelativeTime } from '@/utils/date';

// Mock nearby users and businesses
const mockNearbyUsers: NearbyUser[] = [
  {
    user: {
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
      likesCount: 342,
      lastActiveAt: new Date(2023, 6, 15, 14, 30).toISOString(),
    },
    distance: 0.8,
    lastTopic: {
      id: '101',
      title: 'Best spots for street photography',
      createdAt: new Date(2023, 6, 14).toISOString(),
      distance: 1.2,
    },
  },
  {
    user: {
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
      createdAt: new Date(2022, 5, 10).toISOString(),
      updatedAt: new Date(2023, 6, 12).toISOString(),
      followersCount: 487,
      followingCount: 56,
      topicsCount: 78,
      viewCount: 2345,
      lastActiveAt: new Date(2023, 6, 15, 9, 15).toISOString(),
    },
    distance: 1.3,
  },
  {
    user: {
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
      likesCount: 567,
      lastActiveAt: new Date(2023, 6, 15, 16, 45).toISOString(),
    },
    distance: 1.5,
    lastTopic: {
      id: '102',
      title: 'Morning yoga in the park this weekend',
      createdAt: new Date(2023, 6, 13).toISOString(),
      distance: 0.5,
    },
  }
];

type ExploreTab = 'topics' | 'people' | 'businesses';

export default function ExploreScreen() {
  const router = useRouter();
  const {
    filteredTopics,
    fetchTopics,
    isLoading,
    filter,
    setFilter,
    loadMoreTopics,
    hasMoreTopics,
    likeTopic
  } = useTopicStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ExploreTab>('topics');
  const [loadingMore, setLoadingMore] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  // 滚动相关的状态
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchTopics();
    fetchNearbyUsers();
  }, []);

  const fetchNearbyUsers = async () => {
    setLoadingNearby(true);

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500));

    setNearbyUsers(mockNearbyUsers);
    setLoadingNearby(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'topics') {
      await fetchTopics();
    } else {
      await fetchNearbyUsers();
    }
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setFilter({ search: text });
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMoreTopics || isLoading || activeTab !== 'topics') return;

    setLoadingMore(true);
    await loadMoreTopics();
    setLoadingMore(false);
  };

  const renderFooter = () => {
    if (!loadingMore || activeTab !== 'topics') return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  const handleUserPress = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleTopicPress = (topicId: string) => {
    router.push(`/topic/${topicId}`);
  };

  const handleLikeTopic = (id: string) => {
    likeTopic(id);
  };

  const toggleFilterOptions = () => {
    setShowFilterOptions(!showFilterOptions);
  };

  const handleSortChange = (sortOption: 'recent' | 'popular' | 'distance') => {
    setFilter({ sort: sortOption });
    setShowFilterOptions(false);
  };

  // 简化的滚动处理函数 - 移除了顶部隐藏逻辑
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // 修复类型错误：添加正确的返回类型声明
  const renderPersonCard = (item: NearbyUser): React.ReactElement => {
    const { user, distance, lastTopic } = item;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => handleUserPress(user.id)}
        activeOpacity={0.8}
      >
        <View style={styles.userCardHeader}>
          <Avatar
            source={user.avatar}
            name={user.displayName}
            size="medium"
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.displayName}</Text>
            <View style={styles.userDistance}>
              <MapPin size={12} color={colors.textSecondary} />
              <Text style={styles.distanceText}>
                {distance < 1
                  ? `${Math.round(distance * 1000)}m away`
                  : `${distance.toFixed(1)}km away`}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.userBio} numberOfLines={2}>
          {user.bio}
        </Text>

        <View style={styles.userStats}>
          <View style={styles.statItem}>
            <MessageCircle size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{user.topicsCount} posts</Text>
          </View>
          <View style={styles.statItem}>
            <Heart size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{user.likesCount || 0} likes</Text>
          </View>
        </View>

        {lastTopic && (
          <TouchableOpacity
            style={styles.lastTopic}
            onPress={() => handleTopicPress(lastTopic.id)}
          >
            <Text style={styles.lastTopicLabel}>Latest post:</Text>
            <Text style={styles.lastTopicTitle} numberOfLines={1}>
              {lastTopic.title}
            </Text>
            <View style={styles.lastTopicMeta}>
              <Clock size={12} color={colors.textSecondary} />
              <Text style={styles.lastTopicTime}>
                {getRelativeTime(lastTopic.createdAt)}
              </Text>
              {lastTopic.distance !== undefined && (
                <>
                  <MapPin size={12} color={colors.textSecondary} style={styles.lastTopicIcon} />
                  <Text style={styles.lastTopicDistance}>
                    {lastTopic.distance < 1
                      ? `${Math.round(lastTopic.distance * 1000)}m`
                      : `${lastTopic.distance.toFixed(1)}km`}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // 修复类型错误：添加正确的返回类型声明
  const renderBusinessCard = (item: NearbyUser): React.ReactElement => {
    const { user, distance } = item;

    return (
      <TouchableOpacity
        style={styles.businessCard}
        onPress={() => handleUserPress(user.id)}
        activeOpacity={0.8}
      >
        <View style={styles.businessCardHeader}>
          <View style={styles.businessImageContainer}>
            <Image
              source={{ uri: user.avatar }}
              style={styles.businessImage}
              resizeMode="cover"
            />
            <View style={styles.businessCategory}>
              <Text style={styles.businessCategoryText}>
                {user.businessCategory}
              </Text>
            </View>
          </View>

          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{user.businessName}</Text>
            <View style={styles.businessDistance}>
              <MapPin size={12} color={colors.textSecondary} />
              <Text style={styles.distanceText}>
                {distance < 1
                  ? `${Math.round(distance * 1000)}m away`
                  : `${distance.toFixed(1)}km away`}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.businessBio} numberOfLines={2}>
          {user.bio}
        </Text>

        <View style={styles.businessLocation}>
          <MapPin size={14} color={colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {user.location?.address}
          </Text>
        </View>

        <View style={styles.businessStats}>
          <View style={styles.statItem}>
            <MessageCircle size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{user.topicsCount} updates</Text>
          </View>
          <View style={styles.statItem}>
            <Eye size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{user.viewCount || 0} views</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 修复类型错误：添加正确的返回类型声明
  const renderNearbyItem = ({ item }: { item: NearbyUser }): React.ReactElement => {
    return item.user.type === 'business'
      ? renderBusinessCard(item)
      : renderPersonCard(item);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* 重新设计的顶部区域 */}
      <View style={styles.headerContainer}>
        {/* 标题和过滤按钮在同一行 */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Explore</Text>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={toggleFilterOptions}
          >
            <Filter size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 搜索栏单独一行 */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search topics, tags, or users"
            compact={true}
          />
        </View>

        {/* 过滤选项 - 仅在showFilterOptions为true时显示 */}
        {showFilterOptions && (
          <View style={styles.filterOptionsContainer}>
            <Text style={styles.filterOptionsTitle}>Sort by:</Text>
            <View style={styles.filterOptionsRow}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filter.sort === 'recent' && styles.filterOptionActive
                ]}
                onPress={() => handleSortChange('recent')}
              >
                <Text style={[
                  styles.filterOptionText,
                  filter.sort === 'recent' && styles.filterOptionTextActive
                ]}>
                  Most Recent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filter.sort === 'popular' && styles.filterOptionActive
                ]}
                onPress={() => handleSortChange('popular')}
              >
                <Text style={[
                  styles.filterOptionText,
                  filter.sort === 'popular' && styles.filterOptionTextActive
                ]}>
                  Most Popular
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filter.sort === 'distance' && styles.filterOptionActive
                ]}
                onPress={() => handleSortChange('distance')}
              >
                <Text style={[
                  styles.filterOptionText,
                  filter.sort === 'distance' && styles.filterOptionTextActive
                ]}>
                  Nearest First
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 选项卡区域 */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'topics' && styles.activeTab]}
          onPress={() => setActiveTab('topics')}
        >
          <Search
            size={16}
            color={activeTab === 'topics' ? colors.primary : colors.textSecondary}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'topics' && styles.activeTabText
          ]}>
            Topics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'people' && styles.activeTab]}
          onPress={() => setActiveTab('people')}
        >
          <Users
            size={16}
            color={activeTab === 'people' ? colors.primary : colors.textSecondary}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'people' && styles.activeTabText
          ]}>
            People
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'businesses' && styles.activeTab]}
          onPress={() => setActiveTab('businesses')}
        >
          <Store
            size={16}
            color={activeTab === 'businesses' ? colors.primary : colors.textSecondary}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'businesses' && styles.activeTabText
          ]}>
            Businesses
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'topics' ? (
        isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredTopics}
            keyExtractor={(item) => `explore-topic-${item.id}-${item.authorId}`}
            renderItem={({ item }) => (
              <TopicCard
                topic={item}
                onPress={() => handleTopicPress(item.id)}
                onLike={handleLikeTopic}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No topics found</Text>
                <Text style={styles.emptyText}>
                  Try adjusting your search or filters
                </Text>
              </View>
            }
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
        )
      ) : (
        loadingNearby && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={nearbyUsers.filter(item =>
              activeTab === 'people'
                ? item.user.type === 'person'
                : item.user.type === 'business'
            )}
            keyExtractor={(item) => `user-${item.user.id}-${activeTab}`}
            renderItem={renderNearbyItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>
                  No {activeTab === 'people' ? 'people' : 'businesses'} found nearby
                </Text>
                <Text style={styles.emptyText}>
                  Try adjusting your search or check back later
                </Text>
              </View>
            }
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
        )
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
  },
  // 标题和过滤按钮在同一行
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  // 搜索容器
  searchContainer: {
    marginBottom: 8,
  },
  // 过滤选项相关样式
  filterOptionsContainer: {
    marginBottom: 8,
    padding: 10,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 13,
    color: colors.text,
  },
  filterOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  // 选项卡相关样式
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginRight: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
  },

  // 用户卡片样式
  userCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  userCardHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  userInfo: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  userBio: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 10,
    lineHeight: 18,
  },
  userStats: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  lastTopic: {
    backgroundColor: colors.card,
    padding: 10,
    borderRadius: 8,
  },
  lastTopicLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  lastTopicTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  lastTopicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastTopicTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
    marginRight: 8,
  },
  lastTopicIcon: {
    marginLeft: 4,
  },
  lastTopicDistance: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },

  // 商家卡片样式
  businessCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  businessCardHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  businessImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  businessImage: {
    width: '100%',
    height: '100%',
  },
  businessCategory: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  businessCategoryText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  businessInfo: {
    marginLeft: 10,
    justifyContent: 'center',
    flex: 1,
  },
  businessName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  businessDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessBio: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 10,
    lineHeight: 18,
  },
  businessLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 13,
    color: colors.primary,
    marginLeft: 6,
    flex: 1,
  },
  businessStats: {
    flexDirection: 'row',
  },
});