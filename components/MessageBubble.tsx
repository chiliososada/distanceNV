import React, { useState, useEffect } from 'react';
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

// 获取屏幕宽度用于计算图片尺寸
const { width: screenWidth } = Dimensions.get('window');
const MAX_IMAGE_WIDTH = screenWidth * 0.6; // 设置最大图片宽度为屏幕宽度的60%
const MAX_IMAGE_HEIGHT = 250; // 设置最大图片高度

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar = true,
  avatar,
  name,
  onUserPress,
  onImagePress,
}) => {
  // 添加状态来追踪每个图片加载的尺寸
  const [imageSize, setImageSize] = useState({ width: MAX_IMAGE_WIDTH, height: 150 });

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

  // 计算图片尺寸的函数
  const calculateImageSize = (imageUrl: string) => {
    if (!imageUrl) return;

    Image.getSize(imageUrl, (width, height) => {
      // 计算宽高比
      const aspectRatio = width / height;

      let calculatedWidth, calculatedHeight;

      if (aspectRatio > 1) { // 宽图片
        calculatedWidth = Math.min(width, MAX_IMAGE_WIDTH);
        calculatedHeight = calculatedWidth / aspectRatio;
      } else { // 高图片
        calculatedHeight = Math.min(height, MAX_IMAGE_HEIGHT);
        calculatedWidth = calculatedHeight * aspectRatio;
        // 确保宽度不超过最大宽度
        if (calculatedWidth > MAX_IMAGE_WIDTH) {
          calculatedWidth = MAX_IMAGE_WIDTH;
          calculatedHeight = calculatedWidth / aspectRatio;
        }
      }

      // 更新尺寸状态
      setImageSize({ width: calculatedWidth, height: calculatedHeight });
    }, error => {
      console.error("Error getting image size: ", error);
      // 发生错误时使用默认尺寸
      setImageSize({ width: MAX_IMAGE_WIDTH, height: 150 });
    });
  };

  // 当收到带图片的消息时计算图片尺寸
  useEffect(() => {
    if (message.images && message.images.length > 0) {
      calculateImageSize(message.images[0]);
    }
  }, [message.images]);

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
                  style={[
                    styles.messageImage,
                    // 应用计算出的尺寸
                    {
                      width: imageSize.width,
                      height: imageSize.height,
                    }
                  ]}
                  resizeMode="contain"
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
    // 基础样式，宽高将通过动态计算覆盖
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