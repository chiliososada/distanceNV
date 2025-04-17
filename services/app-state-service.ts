// services/app-state-service.ts
import { AppState, AppStateStatus, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventEmitter from '@/utils/event-emitter';

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
    }

    private handleAppStateChange = async (nextAppState: AppStateStatus) => {
        console.log('App状态从', this.currentState, '变为', nextAppState);

        // 进入前台
        if (nextAppState === 'active' && this.currentState !== 'active') {
            await AsyncStorage.setItem(LAST_ACTIVE_TIME_KEY, Date.now().toString());

            const needsReauthentication = await this.checkSessionTimeout();

            EventEmitter.emit('APP_ACTIVE', { needsReauthentication });
        }
        // 进入后台
        else if ((nextAppState === 'background' || nextAppState === 'inactive') &&
            this.currentState === 'active') {
            await AsyncStorage.setItem(LAST_ACTIVE_TIME_KEY, Date.now().toString());

            EventEmitter.emit('APP_BACKGROUND');
        }

        this.currentState = nextAppState as AppStateType;
    };

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