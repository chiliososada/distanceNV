import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MapPin, Filter, ChevronDown, Clock, TrendingUp, Navigation } from 'lucide-react-native';
import { SearchBar } from '@/components/SearchBar';
import { TopicCard } from '@/components/TopicCard';
import { FilterMenu } from '@/components/FilterMenu';
import { colors } from '@/constants/colors';
import { useTopicStore } from '@/store/topic-store';
import { useAuthStore } from '@/store/auth-store';
import { getCurrentLocation } from '@/utils/location';
import { TopicFilter } from '@/types/topic';

// 减小标题栏的高度，让布局更紧凑
const HEADER_MAX_HEIGHT = 130;
const HEADER_MIN_HEIGHT = 0;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    filteredTopics,
    fetchTopics,
    isLoading,
    filter,
    setFilter,
    hasMoreTopics,
    loadMoreTopics,
    likeTopic
  } = useTopicStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  // Animation related state
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(HEADER_MAX_HEIGHT)).current;

  useEffect(() => {
    fetchTopics();
    loadLocation();
  }, []);

  const loadLocation = async () => {
    const locationData = await getCurrentLocation();
    if (locationData) {
      setLocation('Current Location');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTopics();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setFilter({ search: text });
  };

  const handleFilterPress = () => {
    setFilterMenuVisible(true);
  };

  const handleSortPress = () => {
    setSortMenuVisible(true);
  };

  const handleSortSelect = (sortValue: TopicFilter['sort']) => {
    setFilter({ sort: sortValue });
  };

  const handleFilterSelect = (filterValue: string) => {
    if (filterValue === 'nearby') {
      setFilter({ distance: 5 });
    } else if (filterValue === 'all') {
      setFilter({ distance: undefined });
    }
  };

  const getSortLabel = () => {
    switch (filter.sort) {
      case 'recent': return 'Recent';
      case 'popular': return 'Popular';
      case 'distance': return 'Distance';
      default: return 'Sort';
    }
  };

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreTopics || isLoading) return;

    setLoadingMore(true);
    await loadMoreTopics();
    setLoadingMore(false);
  }, [loadingMore, hasMoreTopics, isLoading, loadMoreTopics]);

  const handleLikeTopic = (id: string) => {
    likeTopic(id);
  };

  // 简化滚动处理函数
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const handleScrollEndDrag = () => {
    // 不进行任何操作
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerText}>Loading more topics...</Text>
      </View>
    );
  };

  const sortOptions = [
    {
      label: 'Recent',
      value: 'recent' as const,
      icon: <Clock size={18} color={filter.sort === 'recent' ? colors.primary : colors.textSecondary} />
    },
    {
      label: 'Popular',
      value: 'popular' as const,
      icon: <TrendingUp size={18} color={filter.sort === 'popular' ? colors.primary : colors.textSecondary} />
    },
    {
      label: 'Distance',
      value: 'distance' as const,
      icon: <Navigation size={18} color={filter.sort === 'distance' ? colors.primary : colors.textSecondary} />
    }
  ];

  const filterOptions = [
    { label: 'All Topics', value: 'all' },
    { label: 'Nearby (5 miles)', value: 'nearby' },
    { label: 'Events Only', value: 'events' },
    { label: 'With Images', value: 'images' }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* 修改后的顶部区域布局 */}
      <View style={styles.headerContainer}>
        {/* 位置信息区域 */}
        <View style={styles.locationContainer}>
          <MapPin size={16} color={colors.primary} />
          <Text style={styles.locationText}>
            {location || 'Set your location'}
          </Text>
        </View>

        {/* 欢迎语和过滤器区域 - 使用flexDirection: 'row'将它们放在同一行 */}
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>
            Hello, {user?.displayName?.split(' ')[0] || 'there'}!
          </Text>

          {/* 过滤和排序按钮移到欢迎语的右侧 */}
          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={handleFilterPress}
            >
              <Filter size={16} color={colors.textSecondary} />
              <Text style={styles.filterText}>Filters</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortButton}
              onPress={handleSortPress}
            >
              <Text style={styles.sortText}>{getSortLabel()}</Text>
              <ChevronDown size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 搜索框单独占一行 */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search topics, tags, or users"
            compact={true}
          />
        </View>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTopics}
          keyExtractor={(item) => `topic-${item.id}-${item.authorId}`}
          renderItem={({ item }) => (
            <TopicCard
              topic={item}
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
              progressViewOffset={HEADER_MAX_HEIGHT}
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollEndDrag={handleScrollEndDrag}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No topics found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters or create a new topic
              </Text>
            </View>
          }
        />
      )}

      {/* Sort Menu */}
      <FilterMenu
        visible={sortMenuVisible}
        onClose={() => setSortMenuVisible(false)}
        title="Sort By"
        options={sortOptions}
        selectedValue={filter.sort}
        onSelect={handleSortSelect}
      />

      {/* Filter Menu */}
      <FilterMenu
        visible={filterMenuVisible}
        onClose={() => setFilterMenuVisible(false)}
        title="Filter Topics"
        options={filterOptions}
        selectedValue={filter.distance ? 'nearby' : 'all'}
        onSelect={handleFilterSelect}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  // 欢迎语和过滤器在同一行
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 使欢迎语和过滤器分居两侧
    alignItems: 'center',
    marginBottom: 10,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    flex: 1, // 让欢迎语占据左侧空间
  },
  // 过滤器和排序按钮容器
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  filterText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginRight: 4,
  },
  // 搜索框单独占一行
  searchContainer: {
    marginBottom: 4,
  },
  listContent: {
    padding: 12,
    paddingBottom: 80, // Add extra padding at the bottom
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
    padding: 16,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
});