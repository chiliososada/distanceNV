import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useTopicStore } from '@/store/topic-store';
import { useChatStore } from '@/store/chat-store';

export default function TopicChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentTopic, fetchTopicById, isLoading: isTopicLoading } = useTopicStore();
  const { createChat, isLoading: isChatLoading } = useChatStore();
  
  const [isCreating, setIsCreating] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchTopicById(id as string);
    }
  }, [id]);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleJoinGroupChat = async () => {
    if (!currentTopic) return;
    
    setIsCreating(true);
    
    try {
      // Check if a group chat for this topic already exists
      // For simplicity, we'll just create a new one
      const chatId = await createChat({
        isGroup: true,
        name: `Discussion: ${currentTopic.title}`,
        participants: [currentTopic.authorId],
        topicId: currentTopic.id,
      });
      
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', 'Failed to create chat. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handlePrivateChat = async () => {
    if (!currentTopic) return;
    
    setIsCreating(true);
    
    try {
      const chatId = await createChat({
        isGroup: false,
        participants: [currentTopic.authorId],
      });
      
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', 'Failed to create chat. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };
  
  if (isTopicLoading || !currentTopic) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Topic Chat',
          headerShown: true,
          headerLeft: () => (
            <Button
              title="Back"
              onPress={handleBack}
              variant="ghost"
              size="small"
              icon={<ChevronLeft size={20} color={colors.text} />}
              iconPosition="left"
            />
          ),
        }} 
      />
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar style="dark" />
        
        <View style={styles.content}>
          <Text style={styles.title}>Join the conversation</Text>
          <Text style={styles.subtitle}>
            Connect with others interested in "{currentTopic.title}"
          </Text>
          
          <View style={styles.optionsContainer}>
            <View style={styles.option}>
              <Text style={styles.optionTitle}>Group Chat</Text>
              <Text style={styles.optionDescription}>
                Join a group discussion with everyone interested in this topic
              </Text>
              <Button
                title="Join Group Chat"
                onPress={handleJoinGroupChat}
                loading={isCreating}
                fullWidth
                style={styles.optionButton}
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.option}>
              <Text style={styles.optionTitle}>Private Message</Text>
              <Text style={styles.optionDescription}>
                Start a private conversation with {currentTopic.author.displayName}
              </Text>
              <Button
                title="Message Author"
                onPress={handlePrivateChat}
                variant="outline"
                loading={isCreating}
                fullWidth
                style={styles.optionButton}
              />
            </View>
          </View>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  optionsContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  option: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  optionButton: {
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
});