import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Info,
  X,
  AlertCircle,
  Loader
} from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { MessageBubble } from '@/components/MessageBubble';
import { colors } from '@/constants/colors';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { Message } from '@/types/chat';
import { ImageViewer } from '@/components/ImageViewer';
import FirebaseStorageService from '@/services/firebase-storage-service';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    chats,
    messages,
    fetchChatById,
    fetchMessages,
    sendMessage,
    markChatAsRead,
    isLoading,
    error,
    connectionStatus,
  } = useChatStore();

  const [messageText, setMessageText] = useState('');
  const [chat, setChat] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // 跟踪初始加载和已读标记
  const initialFetchDoneRef = useRef(false);
  const markAsReadDoneRef = useRef(false);

  useEffect(() => {
    if (id) {
      console.log(`ChatScreen: 加载聊天室 ${id}`);
      fetchChatById(id).then(() => {
        console.log('聊天室加载完成');

        // 如果聊天数据已加载，但消息为空，也设置基本聊天对象
        if (!chat) {
          const basicChat = {
            id: id,
            name: "聊天室",
            isGroup: true,
            participants: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            unreadCount: 0
          };
          setChat(basicChat);
        }
      });
    }
  }, [id]);

  // 关键：监听消息变化，确保UI更新
  useEffect(() => {
    if (id) {
      const chatMessages = messages[id] || [];
      console.log(`ChatScreen: 聊天室 ${id} 消息数量:`, chatMessages.length);

      if (chatMessages.length > 0) {
        console.log('最新消息:', chatMessages[chatMessages.length - 1]);
      }

      // 即使没有 chat 对象，也设置消息
      if (chatMessages.length > 0) {
        if (!chat) {
          const basicChat = {
            id: id,
            name: "聊天室",
            isGroup: true,
            participants: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            unreadCount: 0,
            messages: chatMessages
          };
          setChat(basicChat);
        } else {
          // 更新现有聊天的消息
          setChat({
            ...chat,
            messages: chatMessages
          });
        }

        // 滚动到底部
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  }, [id, messages]);

  // 监听连接状态变化
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      // 显示断开连接提示
      Alert.alert(
        "连接已断开",
        "无法连接到消息服务器，请检查网络连接后重试。",
        [{ text: "确定" }]
      );
    }
  }, [connectionStatus]);

  const handleSend = async () => {
    if ((!messageText.trim() && !selectedImage) || !user) return;

    try {
      setIsSending(true);
      console.log('发送消息:', messageText, '到聊天室:', id);

      // 使用WebSocket服务发送消息
      await sendMessage({
        content: messageText.trim(),
        chatId: id,
        images: selectedImage ? [selectedImage] : undefined
      });

      // 清空输入框和选中的图片
      setMessageText('');
      setSelectedImage(null);
    } catch (error) {
      console.error('发送消息失败:', error);
      Alert.alert('发送失败', '消息发送失败，请稍后重试');
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleChatInfo = () => {
    if (chat) {
      router.push(`/chat/info/${chat.id}`);
    }
  };

  const handleImageUpload = async () => {
    try {
      // 请求权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('需要权限', '请允许访问您的相册以上传图片');
        return;
      }

      // 启动图片选择器
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        try {
          // 上传图片到存储服务
          const uploadedPath = await uploadImageToStorage(result.assets[0].uri, chat.id);
          setSelectedImage(uploadedPath);
        } catch (uploadError) {
          console.error('上传图片失败:', uploadError);
          Alert.alert('上传失败', '图片上传失败，请重试');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '选择图片失败，请重试');
    }
  };

  // 图片上传到存储服务的函数
  const uploadImageToStorage = async (uri: string, chatId: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      // 上传到Firebase Storage并获取路径
      return await FirebaseStorageService.uploadImage(
        blob,
        'chats',
        chatId,
        undefined,
        (progress) => console.log(`上传进度: ${progress}%`)
      );
    } catch (error) {
      console.error('上传图片到存储服务失败:', error);
      throw error;
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleImagePress = (imageUrl: string) => {
    setViewingImage(imageUrl);
  };

  const closeImageViewer = () => {
    setViewingImage(null);
  };

  const handleRetry = () => {
    if (id) {
      fetchChatById(id);
      fetchMessages(id);
    }
  };

  // 仅在初始加载时显示加载指示器
  if (isLoading && !chat) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>发生错误: {error}</Text>
        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!chat) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // 获取真实消息
  const chatMessages = messages[id] || [];
  console.log(`渲染聊天室 ${id} 的 ${chatMessages.length} 条消息`);

  // 模拟其他用户信息，实际应用中应从聊天对象的participants中获取
  const otherUser = {
    id: "other-user",
    type: 'person' as 'person',
    email: 'other@example.com',
    username: 'otheruser',
    displayName: '其他用户',
    avatar: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    followersCount: 10,
    followingCount: 5,
    topicsCount: 3,
    likesCount: 20,
    lastActiveAt: new Date().toISOString(),
    isOnline: true
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="dark" />

      <Stack.Screen
        options={{
          headerTitle: () => (
            <TouchableOpacity
              style={styles.headerTitle}
              onPress={handleChatInfo}
            >
              <Avatar
                source={otherUser?.avatar}
                name={otherUser?.displayName || ""}
                size="small"
              />
              <View style={styles.headerTitleText}>
                <Text style={styles.headerName}>{otherUser?.displayName}</Text>
                <Text style={styles.headerStatus}>
                  {otherUser?.isOnline ? '在线' : '离线'}
                </Text>
              </View>
            </TouchableOpacity>
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleChatInfo} style={styles.headerButton}>
              <Info size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* 连接状态提示 */}
      {connectionStatus === 'connecting' && (
        <View style={styles.connectionStatusBar}>
          <Loader size={14} color="white" />
          <Text style={styles.connectionStatusText}>正在连接服务器...</Text>
        </View>
      )}

      {connectionStatus === 'reconnecting' && (
        <View style={styles.connectionStatusBar}>
          <Loader size={14} color="white" />
          <Text style={styles.connectionStatusText}>重新连接中...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          keyExtractor={(item: Message) => item.id}
          renderItem={({ item }: { item: Message }) => (
            <MessageBubble
              message={item}
              isOwnMessage={item.senderId === user?.id}
              showAvatar={true}
              avatar={item.sender?.avatar || ''}
              name={item.sender?.displayName || '其他用户'}
              onImagePress={handleImagePress}
              status={item.status}
              onResend={() => {
                if (item.senderId === user?.id && item.status === 'failed') {
                  sendMessage({
                    content: item.content,
                    chatId: chat.id,
                    images: item.images,
                    retryMessageId: item.id
                  });
                }
              }}
            />
          )}
          contentContainerStyle={styles.messagesList}
          onLayout={() => {
            if (chatMessages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          extraData={chatMessages.length}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />

        {/* 选中的图片预览 */}
        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            {isUploading ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.uploadingText}>上传中...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 输入框区域 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="输入消息..."
            placeholderTextColor={colors.textSecondary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
            editable={!isSending && !isUploading && connectionStatus !== 'disconnected'}
          />

          {messageText.trim() || selectedImage ? (
            <TouchableOpacity
              style={[
                styles.sendButton,
                (isSending || isUploading || connectionStatus === 'disconnected') && styles.disabledButton
              ]}
              onPress={handleSend}
              disabled={isSending || isUploading || connectionStatus === 'disconnected'}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Send size={24} color={(isUploading || connectionStatus === 'disconnected') ? colors.textLight : colors.primary} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.mediaButton,
                (isUploading || connectionStatus === 'disconnected') && styles.disabledButton
              ]}
              onPress={handleImageUpload}
              disabled={isUploading || connectionStatus === 'disconnected'}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <ImageIcon size={24} color={connectionStatus === 'disconnected' ? colors.textLight : colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* 全屏图片查看器 */}
      {viewingImage && (
        <ImageViewer
          imageUrl={viewingImage}
          visible={!!viewingImage}
          onClose={closeImageViewer}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.text,
    fontWeight: '500',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleText: {
    marginLeft: 8,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  headerStatus: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  connectionStatusBar: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionStatusText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
    paddingBottom: 8,
  },
  selectedImageContainer: {
    margin: 8,
    marginBottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    color: colors.text,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
  },
  mediaButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
});