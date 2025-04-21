import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  Image as ImageIcon,
  MapPin,
  Clock,
  Tag,
  X,
  Plus,
  ChevronRight,
  Loader,
  RefreshCw,
  Check,
  Calendar,
  ChevronLeft
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useTopicStore } from '@/store/topic-store';
import { getCurrentLocation, getAddressFromCoordinates } from '@/utils/location';
import { formatExpirationTime } from '@/utils/date';

// Expiration time options
const EXPIRATION_OPTIONS = [
  { label: '24 hours', value: 1, unit: 'day' },
  { label: '3 days', value: 3, unit: 'day' },
  { label: '1 week', value: 7, unit: 'day' },
  { label: '1 month', value: 30, unit: 'day' },
];

export default function CreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const topicId = params.topicId as string | undefined;

  const {
    createTopic,
    updateTopic,
    fetchTopicById,
    currentTopic,
    isLoading
  } = useTopicStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | undefined>(undefined);
  const [selectedExpirationOption, setSelectedExpirationOption] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [showLocationConfirmation, setShowLocationConfirmation] = useState(false);
  const [showExpirationModal, setShowExpirationModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingTopic, setIsLoadingTopic] = useState(false);
  const [sourceScreen, setSourceScreen] = useState<string | null>(null);

  // Load topic data if in edit mode
  useEffect(() => {
    if (topicId) {
      setIsEditMode(true);
      loadTopicData(topicId);

      // 获取来源页面参数
      if (params.sourceScreen) {
        setSourceScreen(params.sourceScreen as string);
      }
    } else {
      // Reset all fields when not in edit mode
      setTitle('');
      setContent('');
      setImages([]);
      setTags([]);
      setLocation(null);
      setExpiresAt(undefined);
      setSelectedExpirationOption(null);
      setIsEditMode(false);
      setSourceScreen(null);
      checkLocationPermission();
    }

    // Cleanup when component unmounts
    return () => {
      // Clear currentTopic in the store when leaving this screen
      useTopicStore.setState({ currentTopic: null });
    };
  }, [topicId, params.sourceScreen]);

  const loadTopicData = async (id: string) => {
    setIsLoadingTopic(true);
    try {
      // Reset form fields to empty before loading topic data
      setTitle('');
      setContent('');
      setImages([]);
      setTags([]);
      setLocation(null);
      setExpiresAt(undefined);
      setSelectedExpirationOption(null);

      await fetchTopicById(id);

      // After fetching, get the freshly loaded topic directly from the store
      const topic = useTopicStore.getState().currentTopic;

      if (topic) {
        // Only set form fields if we have valid topic data
        setTitle(topic.title || '');
        setContent(topic.content || '');
        setImages(topic.images || []);
        setTags(topic.tags || []);

        if (topic.location) {
          setLocation(topic.location);
        }

        if (topic.expiresAt) {
          setExpiresAt(topic.expiresAt);

          // Try to find matching expiration option
          const now = new Date();
          const expDate = new Date(topic.expiresAt);
          const diffDays = Math.round((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          const optionIndex = EXPIRATION_OPTIONS.findIndex(opt =>
            opt.unit === 'day' && Math.abs(opt.value - diffDays) <= 1
          );

          if (optionIndex !== -1) {
            setSelectedExpirationOption(optionIndex);
          }
        }
      } else {
        Alert.alert('Error', 'Topic not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading topic:', error);
      Alert.alert('Error', 'Failed to load topic data');
    } finally {
      setIsLoadingTopic(false);
    }
  };

  const checkLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');

    if (status === 'granted') {
      fetchCurrentLocation();
    }
  };

  const fetchCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const locationData = await getCurrentLocation();
      if (locationData) {
        const { latitude, longitude } = locationData.coords;
        const address = await getAddressFromCoordinates(latitude, longitude);

        const newLocation = {
          latitude,
          longitude,
          address: address || undefined,
        };

        setLocation(newLocation);
        setShowLocationConfirmation(true);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please try again or enter location manually."
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleAddImages = async () => {
    if (images.length >= 9) {
      Alert.alert('Limit Reached', 'You can only add up to 9 images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;

    const newTag = tagInput.trim().toLowerCase();
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }

    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSetExpiration = (index: number) => {
    const option = EXPIRATION_OPTIONS[index];
    const date = new Date();

    if (option.unit === 'day') {
      date.setDate(date.getDate() + option.value);
    }

    setExpiresAt(date.toISOString());
    setSelectedExpirationOption(index);
    setShowExpirationModal(false);
  };

  const handleRemoveExpiration = () => {
    setExpiresAt(undefined);
    setSelectedExpirationOption(null);
  };

  const handleRefreshLocation = () => {
    if (locationPermission) {
      fetchCurrentLocation();
    } else {
      checkLocationPermission();
    }
  };

  const confirmLocation = () => {
    setShowLocationConfirmation(false);
  };

  const cancelLocation = () => {
    setShowLocationConfirmation(false);
    setLocation(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location is required');
      return;
    }

    const topicData = {
      title,
      content,
      images,
      tags,
      location,
      expiresAt,
    };

    try {
      if (isEditMode && topicId) {
        await updateTopic(topicId, topicData);
        Alert.alert('Success', 'Topic updated successfully');
      } else {
        await createTopic(topicData);
        Alert.alert('Success', 'Topic created successfully');
      }

      // Reset form completely
      setTitle('');
      setContent('');
      setImages([]);
      setTags([]);
      setLocation(null);
      setExpiresAt(undefined);
      setSelectedExpirationOption(null);
      setIsEditMode(false);

      // Clear the current topic to prevent data persistence issues
      useTopicStore.setState({ currentTopic: null });

      // 根据来源页面决定返回路径
      if (sourceScreen === 'profile') {
        router.push('/profile');
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Error saving topic:', error);
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} topic. Please try again.`);
    }
  };

  const handleBack = () => {
    // 如果是从 profile 页面来的，返回 profile 页面
    if (sourceScreen === 'profile') {
      router.push('/profile');
    } else {
      router.back();
    }
  };

  if (isLoadingTopic) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading topic data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <Stack.Screen
        options={{
          title: isEditMode ? 'Edit Topic' : 'Create Topic',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.subtitle}>
              {isEditMode
                ? 'Update your topic information'
                : 'Share something with people nearby'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter a title for your topic"
                placeholderTextColor={colors.textLight}
                maxLength={100}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Content</Text>
              <TextInput
                style={styles.contentInput}
                value={content}
                onChangeText={setContent}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.textLight}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Images</Text>
              <View style={styles.imagesContainer}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri: image }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <X size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}

                {images.length < 9 && (
                  <TouchableOpacity
                    style={styles.addImageButton}
                    onPress={handleAddImages}
                  >
                    <Plus size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagsInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Add tags (e.g., coffee, music)"
                  placeholderTextColor={colors.textLight}
                  onSubmitEditing={handleAddTag}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.addTagButton}
                  onPress={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  <Plus size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveTag(tag)}
                        style={styles.removeTagButton}
                      >
                        <X size={14} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location</Text>
              <TouchableOpacity
                style={[
                  styles.locationButton,
                  location && styles.locationButtonActive
                ]}
                onPress={handleRefreshLocation}
                disabled={loadingLocation}
              >
                {loadingLocation ? (
                  <>
                    <Loader size={20} color={colors.primary} />
                    <Text style={styles.locationText}>
                      Getting your location...
                    </Text>
                  </>
                ) : (
                  <>
                    <MapPin size={20} color={location ? colors.primary : colors.textSecondary} />
                    <Text style={[
                      styles.locationText,
                      location && styles.locationTextActive
                    ]}>
                      {location?.address || 'Use current location'}
                    </Text>
                    <RefreshCw size={20} color={colors.textSecondary} />
                  </>
                )}
              </TouchableOpacity>
              {!locationPermission && !isEditMode && (
                <Text style={styles.locationPermissionText}>
                  Location permission is required to create a topic
                </Text>
              )}
              {location && (
                <Text style={styles.locationConfirmedText}>
                  Location confirmed: {location.address}
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Expiration</Text>
              {expiresAt ? (
                <View style={styles.expirationContainer}>
                  <View style={styles.expirationInfo}>
                    <Calendar size={20} color={colors.primary} />
                    <Text style={styles.expirationText}>
                      {selectedExpirationOption !== null
                        ? `Expires in ${EXPIRATION_OPTIONS[selectedExpirationOption].label}`
                        : formatExpirationTime(expiresAt)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleRemoveExpiration}
                    style={styles.removeExpirationButton}
                  >
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.setExpirationButton}
                  onPress={() => setShowExpirationModal(true)}
                >
                  <Clock size={20} color={colors.textSecondary} />
                  <Text style={styles.setExpirationText}>
                    Set expiration time
                  </Text>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title={isEditMode ? "Update Topic" : "Post Topic"}
          onPress={handleSubmit}
          loading={isLoading}
          //fullWidth
          disabled={!location || !title.trim() || !content.trim()}
        />
      </View>

      {/* Location confirmation modal */}
      <Modal
        visible={showLocationConfirmation}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MapPin size={24} color={colors.primary} />
              <Text style={styles.modalTitle}>Confirm Location</Text>
            </View>

            <Text style={styles.modalText}>
              We found your current location:
            </Text>
            <Text style={styles.locationAddress}>
              {location?.address || 'Unknown location'}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={cancelLocation}
              >
                <Text style={styles.modalButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmLocation}
              >
                <Check size={16} color="white" />
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Expiration selection modal */}
      <Modal
        visible={showExpirationModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Calendar size={24} color={colors.primary} />
              <Text style={styles.modalTitle}>Set Expiration Time</Text>
            </View>

            <Text style={styles.modalText}>
              Choose when this topic will expire:
            </Text>

            <View style={styles.expirationOptions}>
              {EXPIRATION_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.expirationOption}
                  onPress={() => handleSetExpiration(index)}
                >
                  <Clock size={20} color={colors.primary} />
                  <Text style={styles.expirationOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel, styles.fullWidthButton]}
              onPress={() => setShowExpirationModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tagsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  tagInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  addTagButton: {
    padding: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 4,
  },
  removeTagButton: {
    padding: 2,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  locationButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  locationTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  locationPermissionText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  locationConfirmedText: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 8,
    marginLeft: 4,
  },
  expirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: 12,
  },
  expirationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expirationText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  removeExpirationButton: {
    padding: 4,
  },
  setExpirationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  setExpirationText: {
    flex: 1,
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  modalText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 20,
    padding: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  modalButtonCancel: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalButtonTextConfirm: {
    color: 'white',
    marginLeft: 8,
  },
  expirationOptions: {
    marginBottom: 16,
  },
  expirationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 8,
  },
  expirationOptionText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  fullWidthButton: {
    marginTop: 8,
    marginHorizontal: 0,
  },
  headerButton: {
    padding: 8,
  },
});