// services/firebase-auth-service.ts
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
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

    // 用户登录方法并立即登出
    async loginUser(email: string, password: string) {
        try {
            // 登录Firebase获取用户凭证
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // 获取用户信息和ID Token
            const user = userCredential.user;
            let token = null;

            if (user) {
                // 获取ID Token
                token = await user.getIdToken();
            }

            // 返回需要的信息，但不返回userCredential对象
            const result = {
                user: {
                    uid: user.uid,
                    email: user.email,
                    emailVerified: user.emailVerified,
                },
                token: token
            };

            // 不管是否成功都立即登出Firebase
            await this.logoutUser();

            return result;
        } catch (error: any) {
            // 发生错误也尝试登出
            try {
                await this.logoutUser();
            } catch (logoutError) {
                console.error('登出失败:', logoutError);
            }

            // 转换并抛出错误
            const errorMessage = this.getErrorMessage(error.code);
            throw new Error(errorMessage);
        }
    }

    // 获取当前用户的ID Token
    async getUserIdToken(forceRefresh = false) {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('用户未登录');
        }

        return await user.getIdToken(forceRefresh);
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

    // 发送重置密码邮件
    async sendPasswordReset(email: string) {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error: any) {
            const errorMessage = this.getErrorMessage(error.code);
            throw new Error(errorMessage);
        }
    }

    // 获取当前登录用户
    getCurrentUser() {
        return auth.currentUser;
    }

    // 检查用户邮箱是否已验证
    isEmailVerified() {
        const user = this.getCurrentUser();
        return user?.emailVerified || false;
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
            case 'auth/user-disabled':
                return '此账户已被禁用';
            case 'auth/user-not-found':
                return '用户不存在';
            case 'auth/wrong-password':
                return '密码错误';
            case 'auth/weak-password':
                return '密码强度不足';
            case 'auth/operation-not-allowed':
                return '此操作不被允许';
            case 'auth/too-many-requests':
                return '请求次数过多，请稍后再试';
            case 'auth/network-request-failed':
                return '网络请求失败，请检查您的网络连接';
            default:
                return `操作失败：${errorCode}`;
        }
    }
}

export default new FirebaseAuthService();