import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Mail, Lock, CheckCircle, XCircle } from 'lucide-react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import FirebaseAuthService from '@/services/firebase-auth-service';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 验证状态
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // 验证邮箱
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('邮箱地址不能为空');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('请输入有效的邮箱地址');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  // 验证密码
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('密码不能为空');
      return false;
    } else if (password.length < 8) {
      setPasswordError('密码长度至少为8个字符');
      return false;
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError('密码必须包含至少一个大写字母');
      return false;
    } else if (!/[0-9]/.test(password)) {
      setPasswordError('密码必须包含至少一个数字');
      return false;
    } else if (!/[!@#$%^&*]/.test(password)) {
      setPasswordError('密码必须包含至少一个特殊字符 (!@#$%^&*)');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  // 验证确认密码
  const validateConfirmPassword = (confirmPwd: string) => {
    if (!confirmPwd) {
      setConfirmPasswordError('请确认您的密码');
      return false;
    } else if (confirmPwd !== password) {
      setConfirmPasswordError('两次输入的密码不一致');
      return false;
    } else {
      setConfirmPasswordError('');
      return true;
    }
  };

  const handleRegister = async () => {
    // 验证所有字段
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      // 使用Firebase注册
      await FirebaseAuthService.registerUser(email, password);

      // 注册成功，导航到验证邮箱页面
      router.push({
        pathname: '/(auth)/verify-email',
        params: { email }
      });
    } catch (error: any) {
      console.error('注册错误:', error);
      Alert.alert('注册失败', error.message || '注册过程中出现错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>创建账户</Text>
            <Text style={styles.subtitle}>注册以连接社区</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="电子邮箱"
              placeholder="输入您的电子邮箱"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                validateEmail(text);
              }}
              onBlur={() => validateEmail(email)}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={20} color={colors.textSecondary} />}
              error={emailError}
            />

            <Input
              label="密码"
              placeholder="创建密码"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                validatePassword(text);
                if (confirmPassword) {
                  validateConfirmPassword(confirmPassword);
                }
              }}
              onBlur={() => validatePassword(password)}
              isPassword
              leftIcon={<Lock size={20} color={colors.textSecondary} />}
              error={passwordError}
            />

            <Input
              label="确认密码"
              placeholder="确认您的密码"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                validateConfirmPassword(text);
              }}
              onBlur={() => validateConfirmPassword(confirmPassword)}
              isPassword
              leftIcon={<Lock size={20} color={colors.textSecondary} />}
              error={confirmPasswordError}
            />

            {/* 密码要求部分 */}
            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>密码必须包含：</Text>
              <View style={styles.requirement}>
                {password.length >= 8 ? (
                  <CheckCircle size={16} color={colors.success} />
                ) : (
                  <XCircle size={16} color={colors.textSecondary} />
                )}
                <Text style={[
                  styles.requirementText,
                  password.length >= 8 && styles.requirementMet
                ]}>
                  至少8个字符
                </Text>
              </View>
              <View style={styles.requirement}>
                {/[A-Z]/.test(password) ? (
                  <CheckCircle size={16} color={colors.success} />
                ) : (
                  <XCircle size={16} color={colors.textSecondary} />
                )}
                <Text style={[
                  styles.requirementText,
                  /[A-Z]/.test(password) && styles.requirementMet
                ]}>
                  至少一个大写字母
                </Text>
              </View>
              <View style={styles.requirement}>
                {/[0-9]/.test(password) ? (
                  <CheckCircle size={16} color={colors.success} />
                ) : (
                  <XCircle size={16} color={colors.textSecondary} />
                )}
                <Text style={[
                  styles.requirementText,
                  /[0-9]/.test(password) && styles.requirementMet
                ]}>
                  至少一个数字
                </Text>
              </View>
              <View style={styles.requirement}>
                {/[!@#$%^&*]/.test(password) ? (
                  <CheckCircle size={16} color={colors.success} />
                ) : (
                  <XCircle size={16} color={colors.textSecondary} />
                )}
                <Text style={[
                  styles.requirementText,
                  /[!@#$%^&*]/.test(password) && styles.requirementMet
                ]}>
                  至少一个特殊字符 (!@#$%^&*)
                </Text>
              </View>
            </View>

            <Button
              title="创建账户"
              onPress={handleRegister}
              loading={isLoading}
            //fullWidth
            />
          </View>

          <Text style={styles.termsText}>
            注册即表示您同意我们的服务条款和隐私政策
          </Text>

          <View style={styles.loginPrompt}>
            <Text style={styles.loginText}>已有账户？</Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLink}>登录</Text>
            </TouchableOpacity>
          </View>
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
  passwordRequirements: {
    marginTop: 8,
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  requirementMet: {
    color: colors.success,
  },
  termsText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 16,
  },
  loginText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
});