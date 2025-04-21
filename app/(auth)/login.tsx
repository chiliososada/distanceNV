// app/(auth)/login.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, isProfileComplete } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      console.log("登录成功，资料完整性:", isProfileComplete);
      // 检查用户资料是否完整
      if (!isProfileComplete) {
        // 资料不完整，跳转到资料完善页面
        router.push('/profile/complete');
      } else {
        // 资料完整，进入主页
        router.replace('/');
      }
    }
  }, [isAuthenticated, isProfileComplete]);

  useEffect(() => {
    if (error) {
      // 检查是否是邮箱验证错误
      if (error.includes('验证邮箱')) {
        Alert.alert(
          '邮箱未验证',
          '请先点击验证邮件中的链接，然后再尝试登录',
          [
            {
              text: '前往邮箱验证',
              onPress: () => router.push({
                pathname: '/(auth)/verify-email',
                params: { email }
              })
            },
            { text: '取消' }
          ]
        );
      } else {
        Alert.alert('登录错误', error);
      }
    }
  }, [error]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('错误', '请输入邮箱和密码');
      return;
    }

    try {
      await login({ email, password });
    } catch (error) {
      console.error('登录错误:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const navigateToRegister = () => {
    router.push('/register');
  };

  const navigateToForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="dark" />

      <Stack.Screen
        options={{
          title: '登录',
          headerShown: true,
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>欢迎回来</Text>
            <Text style={styles.subtitle}>
              登录继续您的旅程
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="邮箱"
              placeholder="输入您的邮箱"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={20} color={colors.textSecondary} />}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="密码"
              placeholder="输入您的密码"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={20} color={colors.textSecondary} />}
              rightIcon={
                <TouchableOpacity onPress={togglePasswordVisibility}>
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              }
              containerStyle={styles.inputContainer}
            />

            <TouchableOpacity
              onPress={navigateToForgotPassword}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>忘记密码?</Text>
            </TouchableOpacity>

            <Button
              title="登录"
              onPress={handleLogin}
              loading={isLoading}
              //fullWidth
              style={styles.loginButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>还没有账户?</Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={styles.signUpText}>注册</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 复用现有样式...
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
    marginBottom: 32,
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
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  signUpText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  }
});