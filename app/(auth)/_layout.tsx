import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';
import { useLanguageStore } from '@/store/language-store';

export default function AuthLayout() {
  const { translate } = useLanguageStore();
  
  return (
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
      <Stack.Screen
        name="login"
        options={{
          title: translate('login'),
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: translate('register'),
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: translate('forgotPassword'),
        }}
      />
    </Stack>
  );
}