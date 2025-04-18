import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/config/firebase';

class FirebaseAuthService {
    // 注册新用户并发送验证邮件
    async registerUser(email: string, password: string) {
        try {
            // 创建用户
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // 发送验证邮件
            if (userCredential.user) {
                await this.sendVerificationEmail(userCredential.user);
            }

            // 返回用户凭证
            return userCredential;
        } catch (error: any) {
            // 转换Firebase错误为友好错误消息
            const errorMessage = this.getErrorMessage(error.code);
            throw new Error(errorMessage);
        } finally {
            // 无论成功还是失败，都登出用户
            try {
                await this.logoutUser();
                console.log('用户已自动登出');
            } catch (logoutError) {
                console.error('自动登出失败:', logoutError);
            }
        }
    }

    // 发送验证邮件
    async sendVerificationEmail(user: FirebaseUser) {
        try {
            await sendEmailVerification(user);
        } catch (error: any) {
            const errorMessage = this.getErrorMessage(error.code);
            throw new Error(errorMessage);
        }
    }

    // 获取当前登录用户
    getCurrentUser() {
        return auth.currentUser;
    }

    // 登出用户
    async logoutUser() {
        try {
            await signOut(auth);
        } catch (error: any) {
            console.error('登出失败:', error);
            throw error;
        }
    }

    // 将Firebase错误码转换为友好消息
    private getErrorMessage(errorCode: string): string {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return '此邮箱已被注册';
            case 'auth/invalid-email':
                return '邮箱格式不正确';
            case 'auth/weak-password':
                return '密码强度不足';
            case 'auth/operation-not-allowed':
                return '此操作不被允许';
            case 'auth/too-many-requests':
                return '请求次数过多，请稍后再试';
            default:
                return `操作失败：${errorCode}`;
        }
    }
}

export default new FirebaseAuthService();