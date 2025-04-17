import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from './Avatar';
import { Chat } from '@/types/chat';
import { colors } from '@/constants/colors';
import { getRelativeTime } from '@/utils/date';
import { useAuthStore } from '@/store/auth-store';
import { Store, Users } from 'lucide-react-native';

interface ChatItemProps {
  chat: Chat;
  onPress?: () => void;
  currentUserId?: string;
}

export const ChatItem: React.FC<ChatItemProps> = ({ 
  chat, 
  onPress,
  currentUserId 
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = currentUserId || user?.id;
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/chat/${chat.id}`);
    }
  };
  
  // For private chats, show the other participant
  const otherParticipant = !chat.isGroup 
    ? chat.participants.find(p => p.id !== userId)
    : null;
  
  // Display name for the chat
  const displayName = chat.isGroup 
    ? chat.name 
    : otherParticipant?.displayName || 'Chat';
  
  // Avatar for the chat
  const avatarSource = chat.isGroup 
    ? undefined 
    : otherParticipant?.avatar;
  
  // Last message preview
  const lastMessagePreview = chat.lastMessage 
    ? chat.lastMessage.content.length > 30
      ? `${chat.lastMessage.content.substring(0, 30)}...`
      : chat.lastMessage.content
    : 'No messages yet';
  
  // Last message time
  const lastMessageTime = chat.lastMessage 
    ? getRelativeTime(chat.lastMessage.createdAt)
    : getRelativeTime(chat.createdAt);
  
  // Determine chat type
  const isBusiness = otherParticipant?.type === 'business';
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isBusiness && styles.businessContainer,
        chat.isGroup && styles.groupContainer,
        chat.unreadCount > 0 && styles.unreadContainer
      ]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {isBusiness ? (
          <Image 
            source={{ uri: avatarSource }} 
            style={styles.businessAvatar}
          />
        ) : (
          <Avatar 
            source={avatarSource} 
            name={displayName} 
            size="medium" 
            borderColor={chat.isGroup ? colors.groupPrimary : undefined}
            isGroup={chat.isGroup}
          />
        )}
        
        {(isBusiness || chat.isGroup) && (
          <View style={[
            styles.badgeContainer,
            isBusiness ? styles.businessBadge : styles.groupBadge
          ]}>
            {isBusiness ? (
              <Store size={12} color="white" />
            ) : (
              <Users size={12} color="white" />
            )}
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[
            styles.name, 
            isBusiness && styles.businessName,
            chat.isGroup && styles.groupName,
            chat.unreadCount > 0 && styles.unreadName
          ]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.time}>{lastMessageTime}</Text>
        </View>
        
        <View style={styles.messageContainer}>
          <Text style={[
            styles.message, 
            chat.unreadCount > 0 && styles.unreadMessage
          ]} numberOfLines={1}>
            {lastMessagePreview}
          </Text>
          
          {chat.unreadCount > 0 && (
            <View style={[
              styles.unreadBadge,
              isBusiness && styles.businessUnreadBadge,
              chat.isGroup && styles.groupUnreadBadge
            ]}>
              <Text style={styles.unreadCount}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  businessContainer: {
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
  },
  groupContainer: {
    backgroundColor: 'rgba(106, 62, 161, 0.05)', // Deeper purple background for group chats
  },
  unreadContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  avatarContainer: {
    position: 'relative',
  },
  businessAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  businessBadge: {
    backgroundColor: colors.primary,
  },
  groupBadge: {
    backgroundColor: colors.groupPrimary,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  unreadName: {
    fontWeight: '700',
  },
  businessName: {
    color: colors.primary,
  },
  groupName: {
    color: colors.groupPrimary, // Deeper purple color for group names
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: colors.text,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  businessUnreadBadge: {
    backgroundColor: colors.primary,
  },
  groupUnreadBadge: {
    backgroundColor: colors.groupPrimary,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});