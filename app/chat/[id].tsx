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
      // 查找缓存中的聊天
      const chatData = chats.find(c => c.id === id);
      if (chatData) {
        setChat(chatData);

        // 仅在首次加载时获取消息
        if (!initialFetchDoneRef.current && (!messages[id] || messages[id].length === 0)) {
          fetchMessages(id);
          initialFetchDoneRef.current = true;
        }

        // 标记聊天为已读
        if (!markAsReadDoneRef.current && chatData.unreadCount > 0) {
          markChatAsRead(id);
          markAsReadDoneRef.current = true;
        }
      } else {
        fetchChatById(id);
      }
    }
  }, [id, chats]);

  // 监听消息变化
  useEffect(() => {
    if (id && messages[id] && chat) {
      setChat({
        ...chat,
        messages: messages[id] || []
      });

      // 当新消息到达时自动滚动到底部
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
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
    //if ((!messageText.trim() && !selectedImage) || !user || !chat) return;

    try {
      setIsSending(true);



      // 使用统一的发送消息方法
      await sendMessage({
        content: messageText.trim(),
        chatId: "66dcb853-0ef3-4c50-8839-ac299ba704c6",
        images: selectedImage ? [selectedImage] : undefined
      });




      // 清空输入框和选中的图片
      setMessageText('');
      setSelectedImage(null);

      // 滚动到底部
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
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

  // 仅在初始加载时显示加载指示器isLoading && !chat
  if (false) {
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
  //!chat
  if (false) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  //const otherUser = chat.participants.find((p: any) => p.id !== user?.id);
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

  //const chatMessages = messages[chat.id] || [];
  const chatMessages = [
    {
      id: "msg-1",
      content: "你好，我是其他用户",
      senderId: "other-user",
      sender: {
        id: "other-user",
        type: "person",
        email: "other@example.com",
        username: "otheruser",
        displayName: "其他用户",
        avatar: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        followersCount: 5,
        followingCount: 2,
        topicsCount: 1,
        likesCount: 8,
        lastActiveAt: new Date().toISOString()
      },
      chatId: "chat-123",
      createdAt: new Date().toISOString(),
      readBy: ["current-user"],
      status: "read"
    },
    {
      id: "msg-2",
      content: "有空，我们几点见？",
      senderId: "current-user",
      sender: {
        id: "current-user",
        type: "person",
        email: "me@example.com",
        username: "me",
        displayName: "当前用户",
        avatar: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        followersCount: 0,
        followingCount: 0,
        topicsCount: 0,
        likesCount: 0,
        lastActiveAt: new Date().toISOString()
      },
      chatId: "chat-123",
      createdAt: new Date().toISOString(),
      readBy: ["other-user"],
      status: "sent"
    },
    {
      id: "msg-3",
      content: "下午三点怎么样？",
      senderId: "other-user",
      sender: {
        id: "other-user",
        type: "person",
        email: "other@example.com",
        username: "otheruser",
        displayName: "其他用户",
        avatar: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        followersCount: 5,
        followingCount: 2,
        topicsCount: 1,
        likesCount: 8,
        lastActiveAt: new Date().toISOString()
      },
      chatId: "chat-123",
      createdAt: new Date().toISOString(),
      readBy: [],
      status: "delivered"
    }
  ];
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
              avatar={item.senderId === user?.id ? user?.avatar : otherUser?.avatar}
              name={item.senderId === user?.id ? user?.displayName : otherUser?.displayName}
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
          // 确保列表在消息变化时更新
          extraData={chatMessages.length}
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