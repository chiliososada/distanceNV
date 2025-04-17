import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Alert } from 'react-native';
import { useFonts } from 'expo-font';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/auth-store';
import { useLanguageStore } from '@/store/language-store';
import { colors } from '@/constants/colors';
import AppStateService from '@/services/app-state-service';
import EventEmitter from '@/utils/event-emitter';

export default function RootLayout() {
  const { isInitializing, initializeAuth, isAuthenticated, logout } = useAuthStore();
  const { translate } = useLanguageStore();
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();

  // 初始化认证状态
  useEffect(() => {
    initializeAuth();
  }, []);

  // 初始化应用状态监听
  useEffect(() => {
    // 初始化AppState监听
    AppStateService.initialize();

    // 监听应用返回前台事件
    const activeSubscription = EventEmitter.on('APP_ACTIVE', async (data) => {
      console.log('应用回到前台', data);

      // 如果会话超时需要重新登录
      if (data?.needsReauthentication && isAuthenticated) {
        Alert.alert(
          '会话已过期',
          '由于长时间未活动，请重新登录',
          [
            {
              text: '确定',
              onPress: () => {
                logout();
                router.replace('/(auth)/login');
              }
            }
          ]
        );
      }
    });

    // 监听应用进入后台事件
    const backgroundSubscription = EventEmitter.on('APP_BACKGROUND', () => {
      console.log('应用进入后台');
      // 可以在这里添加进入后台时的逻辑
    });

    // 组件卸载时清理
    return () => {
      activeSubscription();
      backgroundSubscription();
      AppStateService.cleanup();
    };
  }, [isAuthenticated]);

  // Handle authentication state changes
  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not already in auth group
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated but still in auth group
      router.replace('/');
    }
  }, [isAuthenticated, segments, isInitializing]);

  const [loaded] = useFonts({
    // You can add custom fonts here if needed
  });

  if (!loaded || isInitializing) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
            color: colors.text,
          },
          headerTintColor: colors.primary,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="topic/[id]" options={{ headerShown: true, title: translate('topics') }} />
        <Stack.Screen name="profile/[id]" options={{ headerShown: true, title: translate('profile') }} />
        <Stack.Screen name="profile/edit" options={{ headerShown: true, title: translate('editProfile') }} />
        <Stack.Screen name="profile/change-password" options={{ headerShown: true, title: translate('changePassword') }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: translate('settings') }} />
        <Stack.Screen name="settings/privacy" options={{ headerShown: true, title: translate('privacySettings') }} />
        <Stack.Screen name="settings/language" options={{ headerShown: true, title: translate('languageSettings') }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: translate('chat') }} />
        <Stack.Screen name="chat/new" options={{ headerShown: true, title: translate('newMessage') }} />
        <Stack.Screen name="chat/topic/[id]" options={{ headerShown: true, title: translate('chat') }} />
        <Stack.Screen name="chat/info/[id]" options={{ headerShown: true, title: 'Chat Info' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}