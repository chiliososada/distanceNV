// services/app-state-service.ts
import { AppState, AppStateStatus, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventEmitter from '@/utils/event-emitter';
import { useAuthStore } from '@/store/auth-store';
import WebSocketService from '@/services/websocket-service'; // 添加WebSocket服务导入

export type AppStateType = 'active' | 'background' | 'inactive' | 'unknown';

const LAST_ACTIVE_TIME_KEY = 'app_last_active_time';

class AppStateService {
    private currentState: AppStateType = 'unknown';
    private appStateSubscription: any = null;
    private sessionTimeoutMs: number = 30 * 60 * 1000; // 30分钟

    initialize() {
        this.currentState = AppState.currentState as AppStateType;

        this.appStateSubscription = AppState.addEventListener(
            'change',
            this.handleAppStateChange
        );

        console.log('AppState监听已初始化, 当前状态:', this.currentState);

        // 应用启动时立即检查WebSocket状态
        if (this.currentState === 'active') {
            this.checkWebSocketConnection();
        }
    }

    // 新增: 检查WebSocket连接方法
    private async checkWebSocketConnection() {
        try {
            const { isAuthenticated } = useAuthStore.getState();

            if (isAuthenticated && !WebSocketService.isConnected()) {
                console.log('应用启动/恢复: 检测到WebSocket未连接，尝试重连...');

                // 尝试从AsyncStorage中恢复会话信息
                const sessionData = await AsyncStorage.getItem('websocket-session');
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    WebSocketService.initialize(session);
                    WebSocketService.connect();
                    console.log('WebSocket连接已恢复');
                } else {
                    console.log('无法恢复WebSocket连接: 未找到会话信息');
                }
            }
        } catch (error) {
            console.error('WebSocket连接检查出错:', error);
        }
    }

    private handleAppStateChange = async (nextAppState: AppStateStatus) => {
        console.log('App状态从', this.currentState, '变为', nextAppState);

        // 进入前台
        if (nextAppState === 'active' && this.currentState !== 'active') {
            await AsyncStorage.setItem(LAST_ACTIVE_TIME_KEY, Date.now().toString());

            // 检查会话超时
            const needsReauthentication = await this.checkSessionTimeout();

            // 检查会话状态
            const isSessionValid = await this.checkSession();

            // 检查WebSocket连接状态 (新增)
            await this.checkWebSocketConnection();

            EventEmitter.emit('APP_ACTIVE', {
                needsReauthentication,
                isSessionValid
            });
        }
        // 进入后台
        else if ((nextAppState === 'background' || nextAppState === 'inactive') &&
            this.currentState === 'active') {
            await AsyncStorage.setItem(LAST_ACTIVE_TIME_KEY, Date.now().toString());

            EventEmitter.emit('APP_BACKGROUND');
        }

        this.currentState = nextAppState as AppStateType;
    };

    private async checkSession(): Promise<boolean> {
        try {
            // 访问auth store检查会话状态
            const checkSession = useAuthStore.getState().checkSession;
            return await checkSession();
        } catch (error) {
            console.error('检查会话状态出错:', error);
            return false;
        }
    }

    private async checkSessionTimeout(): Promise<boolean> {
        try {
            const lastActiveTimeStr = await AsyncStorage.getItem(LAST_ACTIVE_TIME_KEY);
            if (!lastActiveTimeStr) return false;

            const lastActiveTime = parseInt(lastActiveTimeStr, 10);
            const currentTime = Date.now();
            const timeDiff = currentTime - lastActiveTime;

            return timeDiff > this.sessionTimeoutMs;
        } catch (error) {
            console.error('检查会话超时出错:', error);
            return false;
        }
    }

    setSessionTimeout(timeoutMs: number) {
        this.sessionTimeoutMs = timeoutMs;
    }

    getCurrentState(): AppStateType {
        return this.currentState;
    }

    isActive(): boolean {
        return this.currentState === 'active';
    }

    isBackground(): boolean {
        return this.currentState === 'background';
    }

    cleanup() {
        if (this.appStateSubscription) {
            this.appStateSubscription.remove();
            this.appStateSubscription = null;
        }
    }
}

export default new AppStateService();