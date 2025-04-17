import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  ArrowLeft, 
  Bell, 
  Trash2, 
  Flag, 
  UserPlus,
  Users,
  Store,
  Calendar,
  MapPin,
  Link,
  ExternalLink,
  ChevronRight,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { formatDate } from '@/utils/date';

export default function ChatInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    chats,
    fetchChatById, 
    isLoading, 
    error 
  } = useChatStore();
  
  const [chat, setChat] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  useEffect(() => {
    if (id) {
      // Find chat in the store
      const chatData = chats.find(c => c.id === id);
      if (chatData) {
        setChat(chatData);
        setNotificationsEnabled(!chatData.isMuted);
      } else {
        fetchChatById(id);
      }
    }
  }, [id, chats]);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleToggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    // In a real app, we would update the chat's muted status
    Alert.alert(
      value ? "Notifications Enabled" : "Notifications Disabled",
      value 
        ? "You will now receive notifications for this chat" 
        : "You will no longer receive notifications for this chat"
    );
  };
  
  const handleBlockUser = () => {
    Alert.alert(
      "Block User",
      "Are you sure you want to block this user? You won't be able to receive messages from them.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            // In a real app, we would block the user
            Alert.alert("User Blocked", "This user has been blocked");
            router.replace('/chat');
          }
        }
      ]
    );
  };
  
  const handleReportUser = () => {
    Alert.alert(
      "Report",
      "What would you like to report?",
      [
        {
          text: "Spam",
          onPress: () => handleSubmitReport("Spam")
        },
        {
          text: "Inappropriate Content",
          onPress: () => handleSubmitReport("Inappropriate Content")
        },
        {
          text: "Harassment",
          onPress: () => handleSubmitReport("Harassment")
        },
        {
          text: "Other",
          onPress: () => handleSubmitReport("Other")
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };
  
  const handleSubmitReport = (reason: string) => {
    // In a real app, we would submit the report
    Alert.alert(
      "Report Submitted",
      `Thank you for your report. We'll review the ${reason.toLowerCase()} report and take appropriate action.`
    );
  };
  
  const handleDeleteChat = () => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // In a real app, we would delete the chat
            Alert.alert("Chat Deleted", "This chat has been deleted");
            router.replace('/chat');
          }
        }
      ]
    );
  };
  
  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };
  
  const handleAddParticipant = () => {
    // In a real app, we would navigate to a screen to add participants
    Alert.alert("Add Participant", "This would open a screen to add participants to the group");
  };
  
  if (isLoading || !chat) {
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
  
  const otherUser = chat.isGroup 
    ? null 
    : chat.participants.find((p: any) => p.id !== user?.id);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <Stack.Screen 
        options={{
          title: chat.isGroup ? 'Group Info' : 'Chat Info',
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView>
        <View style={styles.profileSection}>
          {chat.isGroup ? (
            <View style={styles.groupAvatarContainer}>
              <View style={styles.groupAvatar}>
                <Text style={styles.groupAvatarText}>
                  {chat.name?.substring(0, 2).toUpperCase() || 'G'}
                </Text>
              </View>
              <Text style={styles.displayName}>{chat.name}</Text>
              <Text style={styles.participantsCount}>
                {chat.participants.length} participants
              </Text>
            </View>
          ) : (
            <View style={styles.userProfileContainer}>
              <Avatar 
                source={otherUser?.avatar} 
                name={otherUser?.displayName} 
                size="large" 
              />
              <Text style={styles.displayName}>{otherUser?.displayName}</Text>
              <Text style={styles.username}>@{otherUser?.username}</Text>
              
              {otherUser?.type === 'business' && (
                <View style={styles.businessBadge}>
                  <Store size={14} color="white" />
                  <Text style={styles.businessBadgeText}>Business</Text>
                </View>
              )}
              
              <View style={styles.profileActions}>
                <TouchableOpacity 
                  style={styles.profileActionButton}
                  onPress={() => handleViewProfile(otherUser?.id)}
                >
                  <ExternalLink size={20} color={colors.primary} />
                  <Text style={styles.profileActionText}>View Profile</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.profileActionButton}
                  onPress={() => router.push(`/chat/${chat.id}`)}
                >
                  <MessageSquare size={20} color={colors.primary} />
                  <Text style={styles.profileActionText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        
        {!chat.isGroup && otherUser?.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{otherUser.bio}</Text>
          </View>
        )}
        
        {!chat.isGroup && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Info</Text>
            
            {otherUser?.location?.address && (
              <View style={styles.infoItem}>
                <MapPin size={20} color={colors.primary} />
                <Text style={styles.infoText}>{otherUser.location.address}</Text>
              </View>
            )}
            
            <View style={styles.infoItem}>
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                Joined {formatDate(new Date(otherUser?.createdAt))}
              </Text>
            </View>
          </View>
        )}
        
        {chat.isGroup && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Participants</Text>
              <TouchableOpacity onPress={handleAddParticipant}>
                <UserPlus size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            {chat.participants.map((participant: any) => (
              <TouchableOpacity 
                key={participant.id}
                style={styles.participantItem}
                onPress={() => handleViewProfile(participant.id)}
              >
                <Avatar 
                  source={participant.avatar} 
                  name={participant.displayName} 
                  size="small" 
                />
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>
                    {participant.displayName}
                    {participant.id === user?.id ? ' (You)' : ''}
                  </Text>
                  <Text style={styles.participantUsername}>
                    @{participant.username}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {chat.lastMessage?.images && chat.lastMessage.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Media</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaContainer}
            >
              {chat.lastMessage.images.map((image: string, index: number) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.mediaItem}
                  onPress={() => {
                    // In a real app, we would open a full-screen image viewer
                    Alert.alert("View Image", "This would open a full-screen image viewer");
                  }}
                >
                  <Image 
                    source={{ uri: image }} 
                    style={styles.mediaImage}
                  />
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={styles.viewAllMedia}
                onPress={() => {
                  // In a real app, we would navigate to a media gallery
                  Alert.alert("View All Media", "This would open a media gallery");
                }}
              >
                <ImageIcon size={24} color={colors.primary} />
                <Text style={styles.viewAllMediaText}>View All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <Bell size={20} color={colors.primary} />
            <Text style={styles.settingText}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.inactive, true: colors.primaryLight }}
              thumbColor={notificationsEnabled ? colors.primary : colors.textLight}
            />
          </View>
        </View>
        
        <View style={styles.dangerSection}>
          {!chat.isGroup && (
            <TouchableOpacity 
              style={styles.dangerButton}
              onPress={handleBlockUser}
            >
              <Flag size={20} color={colors.error} />
              <Text style={styles.dangerButtonText}>Block User</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleReportUser}
          >
            <Flag size={20} color={colors.error} />
            <Text style={styles.dangerButtonText}>
              Report {chat.isGroup ? 'Group' : 'User'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={handleDeleteChat}
          >
            <Trash2 size={20} color={colors.error} />
            <Text style={styles.dangerButtonText}>Delete Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  profileSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userProfileContainer: {
    alignItems: 'center',
  },
  groupAvatarContainer: {
    alignItems: 'center',
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  participantsCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  businessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  businessBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  profileActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  profileActionButton: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  profileActionText: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  participantUsername: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  mediaContainer: {
    paddingBottom: 8,
  },
  mediaItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  viewAllMedia: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllMediaText: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  dangerSection: {
    padding: 16,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    color: colors.error,
    marginLeft: 12,
  },
});