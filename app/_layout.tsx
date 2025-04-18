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
  const { isInitializing, initializeAuth, isAuthenticated, logout, isProfileComplete } = useAuthStore();
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
      if ((data?.needsReauthentication || !data?.isSessionValid) && isAuthenticated) {
        Alert.alert(
          '会话已过期',
          '您的登录已过期，请重新登录',
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
    // 检查是否在个人资料完善页面
    const inProfileCompletePage = segments[0] === 'profile' && segments[1] === 'complete';

    console.log("路由状态检查:", {
      isAuthenticated,
      isProfileComplete,
      inAuthGroup,
      inProfileCompletePage,
      segments
    });

    if (!isAuthenticated && !inAuthGroup) {
      // 未登录且不在认证页面，重定向到登录
      router.replace('/(auth)/login');
    } else if (isAuthenticated) {
      if (inAuthGroup) {
        // 已登录但在认证页面
        if (!isProfileComplete) {
          // 若资料不完整，重定向到资料完善页面
          router.replace('/profile/complete');
        } else {
          // 资料完整，重定向到主页
          router.replace('/');
        }
      } else if (!isProfileComplete && !inProfileCompletePage) {
        // 已登录、资料不完整、不在完善页面，重定向到资料完善页面
        router.replace('/profile/complete');
      }
      // 其他情况不做处理（已登录、资料完整，或已在完善页面）
    }
  }, [isAuthenticated, segments, isInitializing, isProfileComplete]);

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
        <Stack.Screen name="profile/complete" options={{
          headerShown: true,
          title: '完善个人资料',
          headerBackVisible: false, // 防止用户通过返回按钮跳过资料完善
          gestureEnabled: false // 禁用手势返回
        }} />
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