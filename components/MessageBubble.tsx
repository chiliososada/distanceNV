import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';
import { formatMessageTime } from '@/utils/date';
import { Message } from '@/types/chat';
import { Avatar } from './Avatar';
import { Check, Clock, AlertCircle, RotateCcw } from 'lucide-react-native';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  avatar?: string;
  name?: string;
  onUserPress?: (userId: string) => void;
  onImagePress?: (imageUrl: string) => void;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  onResend?: () => void;
}

// 设置最大图片尺寸
const { width: screenWidth } = Dimensions.get('window');
const MAX_IMAGE_WIDTH = screenWidth * 0.6;
const MAX_IMAGE_HEIGHT = 250;

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showAvatar = true,
  avatar,
  name,
  onUserPress,
  onImagePress,
  status,
  onResend,
}) => {
  // 添加状态来跟踪图片尺寸
  const [imageSize, setImageSize] = useState({ width: MAX_IMAGE_WIDTH, height: 150 });
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  // 处理图片尺寸
  const calculateImageSize = (imageUrl: string) => {
    if (!imageUrl) return;

    setImageLoading(true);
    setImageError(false);

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
      setImageSize({
        width: calculatedWidth,
        height: calculatedHeight
      });
      setImageLoading(false);
    }, error => {
      console.error("获取图片尺寸失败: ", error);
      // 出错时使用默认尺寸
      setImageSize({ width: MAX_IMAGE_WIDTH, height: 150 });
      setImageLoading(false);
      setImageError(true);
    });
  };

  // 当收到带图片的消息时计算图片尺寸
  useEffect(() => {
    if (message.images && message.images.length > 0) {
      calculateImageSize(message.images[0]);
    }
  }, [message.images]);

  // 渲染消息状态指示器
  const renderStatusIndicator = () => {
    if (!isOwnMessage) return null;

    // 使用message.status或传入的status属性
    const messageStatus = status || message.status;

    switch (messageStatus) {
      case 'sending':
        return <Clock size={12} color={colors.textSecondary} />;
      case 'sent':
        return <Check size={12} color={colors.textSecondary} />;
      case 'delivered':
        return (
          <View style={styles.doubleCheck}>
            <Check size={12} color={colors.textSecondary} />
            <Check size={12} color={colors.textSecondary} style={styles.secondCheck} />
          </View>
        );
      case 'read':
        return (
          <View style={styles.doubleCheck}>
            <Check size={12} color={colors.primary} />
            <Check size={12} color={colors.primary} style={styles.secondCheck} />
          </View>
        );
      case 'failed':
        return (
          <TouchableOpacity onPress={onResend} style={styles.retryButton}>
            <AlertCircle size={12} color={colors.error} />
            <RotateCcw size={12} color={colors.error} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  // 限制消息气泡最大宽度
  const maxBubbleWidth = screenWidth * 0.75;

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
          { maxWidth: maxBubbleWidth },
          message.status === 'failed' && styles.failedBubble
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
                style={styles.imageWrapper}
              >
                {imageLoading ? (
                  <View style={[styles.imageLoading, { width: imageSize.width, height: imageSize.height }]}>
                    <ActivityIndicator color={colors.primary} size="small" />
                  </View>
                ) : imageError ? (
                  <View style={[styles.imageError, { width: imageSize.width, height: imageSize.height }]}>
                    <AlertCircle size={24} color={colors.error} />
                    <Text style={styles.imageErrorText}>加载失败</Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: imageUrl }}
                    style={[
                      styles.messageImage,
                      {
                        width: imageSize.width,
                        height: imageSize.height,
                      }
                    ]}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.messageFooter}>
          {renderStatusIndicator()}
          <Text
            style={[styles.timestamp, isOwnMessage && styles.ownTimestamp]}
          >
            {formatMessageTime(message.createdAt)}
          </Text>
        </View>
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
  failedBubble: {
    backgroundColor: 'rgba(245, 54, 92, 0.1)', // 轻微红色背景表示发送失败
    borderColor: colors.error,
    borderWidth: 1,
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
  },
  imageWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4,
  },
  messageImage: {
    borderRadius: 8,
  },
  imageLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  imageError: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 54, 92, 0.1)',
    borderRadius: 8,
  },
  imageErrorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  doubleCheck: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondCheck: {
    marginLeft: -4,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
});