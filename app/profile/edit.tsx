import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Image
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { 
  ChevronLeft, 
  Camera, 
  MapPin, 
  User, 
  Mail, 
  AtSign, 
  FileText 
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { getCurrentLocation, getAddressFromCoordinates } from '@/utils/location';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, isLoading } = useAuthStore();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [location, setLocation] = useState(user?.location?.address || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const handleBack = () => {
    router.back();
  };
  
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };
  
  const handleUpdateLocation = async () => {
    const locationData = await getCurrentLocation();
    if (locationData) {
      const { latitude, longitude } = locationData.coords;
      const address = await getAddressFromCoordinates(latitude, longitude);
      
      if (address) {
        setLocation(address);
      }
    }
  };
  
  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }
    
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }
    
    setIsSaving(true);
    
    try {
      await updateProfile({
        displayName,
        username,
        bio,
        avatar,
        location: location ? {
          latitude: user?.location?.latitude || 0,
          longitude: user?.location?.longitude || 0,
          address: location,
        } : undefined,
      });
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!user) return null;
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Edit Profile',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar style="dark" />
        
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.avatarContainer}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={40} color={colors.textLight} />
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.changeAvatarButton}
                onPress={handlePickImage}
              >
                <Camera size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <User size={20} color={colors.primary} />
                  <Text style={styles.labelText}>Display Name</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your full name"
                  placeholderTextColor={colors.textLight}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <AtSign size={20} color={colors.primary} />
                  <Text style={styles.labelText}>Username</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Your username"
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <Mail size={20} color={colors.primary} />
                  <Text style={styles.labelText}>Email</Text>
                </View>
                <Text style={styles.emailText}>{user.email}</Text>
                <Text style={styles.emailNote}>Email cannot be changed</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <FileText size={20} color={colors.primary} />
                  <Text style={styles.labelText}>Bio</Text>
                </View>
                <TextInput
                  style={styles.bioInput}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself"
                  placeholderTextColor={colors.textLight}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <MapPin size={20} color={colors.primary} />
                  <Text style={styles.labelText}>Location</Text>
                </View>
                <View style={styles.locationContainer}>
                  <TextInput
                    style={styles.locationInput}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Your location"
                    placeholderTextColor={colors.textLight}
                    editable={false}
                  />
                  <TouchableOpacity 
                    style={styles.updateLocationButton}
                    onPress={handleUpdateLocation}
                  >
                    <Text style={styles.updateLocationText}>Update</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        
        <View style={styles.footer}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={isSaving}
            fullWidth
          />
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  headerButton: {
    padding: 8,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  formSection: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    height: 100,
  },
  emailText: {
    fontSize: 16,
    color: colors.textSecondary,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  emailNote: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
  updateLocationButton: {
    marginLeft: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  updateLocationText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});