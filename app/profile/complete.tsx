// app/profile/complete.tsx
import React, { useState } from 'react';
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
import { Camera, User } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';

export default function CompleteProfileScreen() {
    const router = useRouter();
    const { user, updateProfile, isLoading } = useAuthStore();

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatar, setAvatar] = useState<string | undefined>(user?.avatar);

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

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert('错误', '请输入显示名称');
            return;
        }

        if (!username.trim()) {
            Alert.alert('错误', '请输入用户名');
            return;
        }

        try {
            await updateProfile({
                displayName,
                username,
                bio,
                avatar,
            });

            Alert.alert('成功', '资料已更新', [
                { text: '确定', onPress: () => router.replace('/') }
            ]);
        } catch (error: any) {
            console.error('更新资料错误:', error);
            Alert.alert('错误', error.message || '更新资料失败，请重试');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <Stack.Screen
                options={{
                    title: '完善个人资料',
                    headerShown: true
                }}
            />

            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>完善您的个人资料</Text>
                        <Text style={styles.subtitle}>
                            请提供一些基本信息以便我们能更好地为您服务
                        </Text>
                    </View>

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

                    <View style={styles.form}>
                        <Input
                            label="显示名称"
                            placeholder="您希望别人如何称呼您"
                            value={displayName}
                            onChangeText={setDisplayName}
                            containerStyle={styles.inputContainer}
                        />

                        <Input
                            label="用户名"
                            placeholder="创建一个唯一的用户名"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            containerStyle={styles.inputContainer}
                        />

                        <View style={styles.bioContainer}>
                            <Text style={styles.label}>个人简介</Text>
                            <TextInput
                                style={styles.bioInput}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="告诉我们一些关于您的信息"
                                placeholderTextColor={colors.textLight}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <Button
                        title="保存并继续"
                        onPress={handleSave}
                        loading={isLoading}
                        fullWidth
                        style={styles.saveButton}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
        flexGrow: 1,
        padding: 24,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
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
    form: {
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 16,
    },
    bioContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 6,
        color: colors.text,
        fontWeight: '500',
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
    saveButton: {
        marginTop: 8,
    }
});