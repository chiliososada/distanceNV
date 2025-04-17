import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { colors } from '@/constants/colors';
import { formatMessageTime } from '@/utils/date';
import { Message } from '@/types/chat';
import { Avatar } from './Avatar';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  avatar?: string;
  name?: string;
  onUserPress?: (userId: string) => void;
  onImagePress?: (imageUrl: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar = true,
  avatar,
  name,
  onUserPress,
  onImagePress,
}) => {
  const handleUserPress = () => {
    if (onUserPress && message.sender) {
      onUserPress(message.sender.id);
    }
  };

  const handleImagePress = (imageUrl: string) => {
    if (onImagePress) {
      onImagePress(imageUrl);
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const maxBubbleWidth = screenWidth * 0.75; // 75% of screen width

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
      ]}
    >
      {!isOwnMessage && showAvatar ? (
        <TouchableOpacity onPress={handleUserPress} style={styles.avatarContainer}>
          <Avatar
            source={avatar}
            name={name || ""}
            size={36}
          />
        </TouchableOpacity>
      ) : !isOwnMessage ? (
        <View style={styles.avatarPlaceholder} />
      ) : null}

      <View
        style={[
          styles.bubbleContainer,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
          { maxWidth: maxBubbleWidth }
        ]}
      >
        {!isOwnMessage && message.sender && (
          <TouchableOpacity onPress={handleUserPress}>
            <Text style={styles.senderName}>{name || message.sender.displayName}</Text>
          </TouchableOpacity>
        )}

        {message.content ? (
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {message.content}
          </Text>
        ) : null}

        {message.images && message.images.length > 0 ? (
          <View style={styles.imageContainer}>
            {message.images.map((imageUrl, index) => (
              <TouchableOpacity 
                key={index}
                onPress={() => handleImagePress(imageUrl)}
                activeOpacity={0.9}
              >
                <Image 
                  source={{ uri: imageUrl }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text
          style={[styles.timestamp, isOwnMessage && styles.ownTimestamp]}
        >
          {formatMessageTime(message.createdAt)}
        </Text>
      </View>

      {isOwnMessage && showAvatar ? (
        <TouchableOpacity onPress={handleUserPress} style={styles.avatarContainer}>
          <Avatar
            source={avatar}
            name={name || ""}
            size={36}
          />
        </TouchableOpacity>
      ) : isOwnMessage ? (
        <View style={styles.avatarPlaceholder} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: 4,
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
  },
  avatarPlaceholder: {
    width: 36,
    marginHorizontal: 4,
  },
  bubbleContainer: {
    borderRadius: 16,
    padding: 12,
    paddingBottom: 8,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  ownMessageText: {
    color: 'white',
  },
  imageContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});