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
  X
} from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { MessageBubble } from '@/components/MessageBubble';
import { colors } from '@/constants/colors';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { Message } from '@/types/chat';
import { ImageViewer } from '@/components/ImageViewer';

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
    error 
  } = useChatStore();
  
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  // Track if initial fetch has been done
  const initialFetchDoneRef = useRef(false);
  const markAsReadDoneRef = useRef(false);
  
  useEffect(() => {
    if (id) {
      // Find chat in the store
      const chatData = chats.find(c => c.id === id);
      if (chatData) {
        setChat(chatData);
        
        // Only fetch messages if we haven't already or if they're not in the store
        if (!initialFetchDoneRef.current && (!messages[id] || messages[id].length === 0)) {
          fetchMessages(id);
          initialFetchDoneRef.current = true;
        }
        
        // Mark chat as read when entering
        if (!markAsReadDoneRef.current && chatData.unreadCount > 0) {
          markChatAsRead(id);
          markAsReadDoneRef.current = true;
        }
      } else {
        fetchChatById(id);
      }
    }
  }, [id, chats]);
  
  // Update chat when messages change
  useEffect(() => {
    if (id && messages[id] && chat) {
      setChat({
        ...chat,
        messages: messages[id] || []
      });
    }
  }, [id, messages]);
  
  const handleSend = async () => {
    if ((!message.trim() && !selectedImage) || !user || !chat) return;
    
    const messageData = {
      content: message.trim(),
      chatId: chat.id,
      images: selectedImage ? [selectedImage] : undefined
    };
    
    try {
      setIsSending(true);
      await sendMessage(messageData);
      setMessage('');
      setSelectedImage(null);
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
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
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
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
  
  // Only show loading indicator when initially loading the chat, not when sending messages
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
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
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
  
  const otherUser = chat.participants.find((p: any) => p.id !== user?.id);
  const chatMessages = messages[chat.id] || [];
  
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
                  {otherUser?.isOnline ? 'Online' : 'Offline'}
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
            />
          )}
          contentContainerStyle={styles.messagesList}
          onLayout={() => {
            if (chatMessages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          // This ensures the list updates when messages change
          extraData={chatMessages.length}
        />
        
        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={handleRemoveImage}
            >
              <X size={16} color="white" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
          />
          
          {message.trim() || selectedImage ? (
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleSend}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Send size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.mediaButton}
              onPress={handleImageUpload}
            >
              <ImageIcon size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Image Viewer Modal */}
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
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
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
    height: 150,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
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
});