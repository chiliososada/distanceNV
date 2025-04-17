import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Alert,
  Share as RNShare,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  Heart, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Share2,
  ChevronLeft,
  MoreHorizontal,
  Flag,
  Bookmark,
  Copy,
  Trash2,
  Edit
} from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useTopicStore } from '@/store/topic-store';
import { useAuthStore } from '@/store/auth-store';
import { formatDate, formatTimeAgo } from '@/utils/date';

const { width } = Dimensions.get('window');

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentTopic, fetchTopicById, likeTopic, isLoading } = useTopicStore();
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchTopicById(id as string);
    }
  }, [id]);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleLike = () => {
    if (currentTopic) {
      likeTopic(currentTopic.id);
    }
  };
  
  const handleChat = () => {
    if (currentTopic) {
      router.push(`/chat/topic/${currentTopic.id}`);
    }
  };
  
  const handleShare = async () => {
    if (!currentTopic) return;
    
    try {
      // Enhanced share content with more details
      const shareContent = {
        title: currentTopic.title,
        message: Platform.OS === 'ios' 
          ? `${currentTopic.title} - by ${currentTopic.author.displayName}` 
          : `${currentTopic.title}

${currentTopic.content}

Posted by: ${currentTopic.author.displayName}
Location: ${currentTopic.location?.address || 'Nearby'}
Tags: ${currentTopic.tags.map(tag => `#${tag}`).join(' ')}

Shared from Nearby App`
      };
      
      const result = await RNShare.share(shareContent);
      
      if (result.action === RNShare.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === RNShare.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not share this topic');
    }
  };
  
  const handleAuthorPress = () => {
    if (currentTopic) {
      router.push(`/profile/${currentTopic.authorId}`);
    }
  };
  
  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
  };

  const toggleOptionsMenu = () => {
    setShowOptionsMenu(!showOptionsMenu);
  };

  const handleBookmark = () => {
    Alert.alert("Bookmarked", "Topic saved to your bookmarks");
    setShowOptionsMenu(false);
  };

  const handleCopyLink = () => {
    Alert.alert("Copied", "Topic link copied to clipboard");
    setShowOptionsMenu(false);
  };

  const handleReport = () => {
    Alert.alert(
      "Report Topic",
      "Are you sure you want to report this topic?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Report",
          onPress: () => {
            Alert.alert("Report Submitted", "Thank you for your report. We'll review it shortly.");
          }
        }
      ]
    );
    setShowOptionsMenu(false);
  };

  const handleEdit = () => {
    if (currentTopic) {
      // Changed to match the same route as profile page
      router.push({
        pathname: '/create',
        params: { topicId: currentTopic.id }
      });
    }
    setShowOptionsMenu(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Topic",
      "Are you sure you want to delete this topic? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: () => {
            // Delete topic logic would go here
            router.replace('/');
          },
          style: "destructive"
        }
      ]
    );
    setShowOptionsMenu(false);
  };
  
  if (isLoading || !currentTopic) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }
  
  const isExpired = currentTopic.expiresAt && new Date(currentTopic.expiresAt) < new Date();
  const isAuthor = user && user.id === currentTopic.authorId;
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Topic',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={handleShare}
              >
                <Share2 size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={toggleOptionsMenu}
              >
                <MoreHorizontal size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      {showOptionsMenu && (
        <View style={styles.optionsMenu}>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={handleBookmark}
          >
            <Bookmark size={20} color={colors.text} />
            <Text style={styles.optionText}>Bookmark</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={handleShare}
          >
            <Share2 size={20} color={colors.text} />
            <Text style={styles.optionText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={handleCopyLink}
          >
            <Copy size={20} color={colors.text} />
            <Text style={styles.optionText}>Copy Link</Text>
          </TouchableOpacity>
          
          {isAuthor && (
            <>
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={handleEdit}
              >
                <Edit size={20} color={colors.text} />
                <Text style={styles.optionText}>Edit Topic</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={handleDelete}
              >
                <Trash2 size={20} color={colors.error} />
                <Text style={[styles.optionText, styles.deleteText]}>Delete Topic</Text>
              </TouchableOpacity>
            </>
          )}
          
          {!isAuthor && (
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={handleReport}
            >
              <Flag size={20} color={colors.warning} />
              <Text style={[styles.optionText, styles.reportText]}>Report</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar style="dark" />
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.authorContainer}>
            <TouchableOpacity onPress={handleAuthorPress}>
              <Avatar 
                source={currentTopic.author.avatar} 
                name={currentTopic.author.displayName} 
                size="medium" 
              />
            </TouchableOpacity>
            <View style={styles.authorInfo}>
              <TouchableOpacity onPress={handleAuthorPress}>
                <Text style={styles.authorName}>{currentTopic.author.displayName}</Text>
              </TouchableOpacity>
              <Text style={styles.timestamp}>{formatDate(currentTopic.createdAt)}</Text>
            </View>
          </View>
          
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{currentTopic.title}</Text>
            <Text style={styles.content}>{currentTopic.content}</Text>
          </View>
          
          {currentTopic.images.length > 0 && (
            <View style={styles.imagesContainer}>
              <Image 
                source={{ uri: currentTopic.images[selectedImageIndex] }} 
                style={styles.mainImage} 
                resizeMode="cover"
              />
              
              {currentTopic.images.length > 1 && (
                <FlatList
                  data={currentTopic.images}
                  keyExtractor={(item, index) => `image-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailsContainer}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      onPress={() => handleImagePress(index)}
                      style={[
                        styles.thumbnailContainer,
                        selectedImageIndex === index && styles.selectedThumbnailContainer
                      ]}
                    >
                      <Image 
                        source={{ uri: item }} 
                        style={styles.thumbnail} 
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}
          
          {currentTopic.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {currentTopic.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          
          <View style={styles.metaContainer}>
            {currentTopic.location && (
              <View style={styles.metaItem}>
                <MapPin size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {currentTopic.location.address || 'Location set'}
                  {currentTopic.distance !== undefined && 
                    ` (${currentTopic.distance < 1 
                      ? `${Math.round(currentTopic.distance * 1000)}m` 
                      : `${currentTopic.distance.toFixed(1)}km`} away)`
                  }
                </Text>
              </View>
            )}
            
            {currentTopic.expiresAt && (
              <View style={styles.metaItem}>
                <Clock size={16} color={isExpired ? colors.error : colors.textSecondary} />
                <Text style={[
                  styles.metaText, 
                  isExpired && styles.expiredText
                ]}>
                  {isExpired 
                    ? 'Expired' 
                    : `Expires ${formatTimeAgo(currentTopic.expiresAt)}`}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={styles.statButton} 
              onPress={handleLike}
            >
              <Heart 
                size={24} 
                color={currentTopic.isLiked ? colors.secondary : colors.textSecondary} 
                fill={currentTopic.isLiked ? colors.secondary : 'none'} 
              />
              <Text style={[
                styles.statText, 
                currentTopic.isLiked && styles.likedText
              ]}>
                {currentTopic.likesCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.statButton} 
              onPress={handleChat}
            >
              <MessageCircle size={24} color={colors.textSecondary} />
              <Text style={styles.statText}>{currentTopic.commentsCount}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.statButton} 
              onPress={handleShare}
            >
              <Share2 size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Button
            title="Join Discussion"
            onPress={handleChat}
            fullWidth
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerButton: {
    padding: 8,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  deleteText: {
    color: colors.error,
  },
  reportText: {
    color: colors.warning,
  },
  scrollContent: {
    padding: 16,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  timestamp: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  contentContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  imagesContainer: {
    marginBottom: 16,
  },
  mainImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 8,
  },
  thumbnailsContainer: {
    paddingVertical: 8,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThumbnailContainer: {
    borderColor: colors.primary,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  metaContainer: {
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  expiredText: {
    color: colors.error,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  likedText: {
    color: colors.secondary,
  },
});