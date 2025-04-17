import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, MessageSquare, Heart } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { getRelativeTime } from '@/utils/date';
import { Topic } from '@/types/topic';
import { Avatar } from './Avatar';
import { useTopicStore } from '@/store/topic-store';

interface TopicCardProps {
  topic: Topic;
  onPress?: () => void;
  showDistance?: boolean;
  onLike?: (id: string) => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({ 
  topic, 
  onPress,
  showDistance = true,
  onLike
}) => {
  const router = useRouter();
  const { likeTopic } = useTopicStore();
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/topic/${topic.id}`);
    }
  };
  
  const handleUserPress = () => {
    router.push(`/profile/${topic.author.id}`);
  };
  
  const handleLike = () => {
    if (onLike) {
      onLike(topic.id);
    } else {
      likeTopic(topic.id);
    }
  };
  
  const handleComment = () => {
    router.push(`/topic/${topic.id}?focusComment=true`);
  };
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleUserPress}>
          <View style={styles.authorContainer}>
            <Avatar 
              source={topic.author.avatar} 
              size={36} 
              name={topic.author.displayName} 
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{topic.author.displayName}</Text>
              <Text style={styles.timeAgo}>{getRelativeTime(topic.createdAt)}</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        {showDistance && topic.location && topic.distance !== undefined && (
          <View style={styles.locationContainer}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={styles.locationText}>{topic.distance.toFixed(1)} mi</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.title}>{topic.title}</Text>
      
      {topic.content && (
        <Text 
          style={styles.content}
          numberOfLines={3}
        >
          {topic.content}
        </Text>
      )}
      
      {/* Location information */}
      {topic.location && topic.location.address && (
        <View style={styles.addressContainer}>
          <MapPin size={16} color={colors.primary} />
          <Text style={styles.addressText}>{topic.location.address}</Text>
        </View>
      )}
      
      {topic.images && topic.images.length > 0 && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: topic.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
          {topic.images.length > 1 && (
            <View style={styles.moreImagesIndicator}>
              <Text style={styles.moreImagesText}>+{topic.images.length - 1}</Text>
            </View>
          )}
        </View>
      )}
      
      {topic.tags && topic.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {topic.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleLike}
        >
          <Heart 
            size={18} 
            color={topic.isLiked ? colors.primary : colors.textSecondary}
            fill={topic.isLiked ? colors.primary : 'transparent'}
          />
          <Text style={[
            styles.actionText,
            topic.isLiked && styles.likedText
          ]}>
            {topic.likesCount}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleComment}
        >
          <MessageSquare size={18} color={colors.textSecondary} />
          <Text style={styles.actionText}>{topic.commentsCount}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorInfo: {
    marginLeft: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timeAgo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  content: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 10,
    lineHeight: 20,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: colors.primaryLight + '20', // Light background with opacity
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addressText: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 6,
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: width * 0.5,
    borderRadius: 8,
  },
  moreImagesIndicator: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  moreImagesText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
  },
  tagText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  likedText: {
    color: colors.primary,
  },
});