import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';

export default function VerifyEmailScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams();
    const decodedEmail = email ? decodeURIComponent(email as string) : '';

    const handleBackToLogin = () => {
        router.replace('/(auth)/login');
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Mail size={48} color={colors.primary} />
                    </View>
                    <Text style={styles.title}>验证您的邮箱</Text>
                    <Text style={styles.subtitle}>
                        我们已发送验证链接到：
                    </Text>
                    <Text style={styles.emailText}>{decodedEmail}</Text>
                    <Text style={styles.instructions}>
                        请检查您的邮箱并点击验证链接完成注册。验证完成后，您将可以登录应用。
                    </Text>
                </View>

                <View style={styles.buttonsContainer}>
                    <Button
                        title="返回登录"
                        onPress={handleBackToLogin}
                        //fullWidth
                        style={styles.button}
                    />
                </View>

                <View style={styles.helpSection}>
                    <Text style={styles.helpTitle}>没有收到邮件？</Text>
                    <Text style={styles.helpText}>
                        • 检查您的垃圾邮件或垃圾箱{'\n'}
                        • 确认 {decodedEmail} 是否正确{'\n'}
                        • 稍后您可以在登录页面选择"忘记密码"重新获取验证邮件
                    </Text>
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
    scrollContent: {
        padding: 24,
        flexGrow: 1,
    },
    backButton: {
        marginBottom: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: 8,
        textAlign: 'center',
    },
    emailText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: 16,
        textAlign: 'center',
    },
    instructions: {
        fontSize: 16,
        color: colors.text,
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonsContainer: {
        marginBottom: 32,
    },
    button: {
        marginBottom: 16,
    },
    helpSection: {
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
    },
    helpTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    helpText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 22,
    },
});