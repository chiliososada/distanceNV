// services/websocket-service.ts 修改版

import { nanoid } from 'nanoid';
import { useChatStore } from '@/store/chat-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
    type: string;
    message: string;
    message_id: string;
    chat_id: string;
    user_id: string;
    at: string;
    nickname?: string;
    avatar_url?: string;
}

export interface Session {
    uid: string;
    chat_token: string;
    chat_url: string;
    display_name: string;
    photo_url?: string;
}

const parseChatMessage = (data: any): ChatMessage => {
    if (!data || typeof data !== 'object') {
        throw new Error('无效的消息格式');
    }

    if (!data.chat_id || !data.message_id) {
        throw new Error('消息缺少必要字段');
    }

    return data as ChatMessage;
};

class WebSocketService {
    private static instance: WebSocketService;
    private ws: WebSocket | null = null;
    private session: Session | null = null;
    private reconnectTimeout: number | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000; // 3秒
    private connectingPromise: Promise<boolean> | null = null;
    private pendingMessages: Array<{ chatId: string, message: string }> = [];
    private connectionState: 'closed' | 'connecting' | 'open' | 'closing' = 'closed';

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    private constructor() { }

    // 初始化会话信息
    public initialize(session: Session): void {
        this.session = session;
        this.reconnectAttempts = 0;
        this.connectionState = 'closed';

        try {
            AsyncStorage.setItem('websocket-session', JSON.stringify(session));
        } catch (error) {
            console.error('保存WebSocket会话信息失败:', error);
        }
    }

    // 连接WebSocket并返回Promise
    public async connectAsync(): Promise<boolean> {
        if (this.connectingPromise) {
            return this.connectingPromise;
        }

        if (!this.session) {
            console.error('尝试在没有会话的情况下连接WebSocket');
            return Promise.resolve(false);
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket已连接');
            return Promise.resolve(true);
        }

        this.connectionState = 'connecting';
        console.log(`正在连接到WebSocket: ${this.session.chat_url}`);

        this.connectingPromise = new Promise((resolve) => {
            try {
                const session = this.session;

                // 关闭现有连接
                if (this.ws) {
                    this.ws.onclose = null; // 移除旧事件处理器
                    this.ws.onerror = null;
                    this.ws.onmessage = null;
                    this.ws.onopen = null;
                    this.ws.close();
                    this.ws = null;
                }

                // 创建新连接
                this.ws = new WebSocket(session!.chat_url);

                this.ws.onopen = () => {
                    console.log(`已连接到WebSocket: ${session!.chat_url}`);
                    this.connectionState = 'open';

                    // 发送验证消息
                    if (this.ws && this.session) {
                        console.log(this.session.chat_token);
                        try {
                            this.ws.send(JSON.stringify({
                                "type": "Validate",
                                "user_id": this.session.uid,
                                "token": this.session.chat_token,
                            }));

                            // 重置重连尝试
                            this.reconnectAttempts = 0;
                            resolve(true);

                            // 处理等待的消息
                            this.processPendingMessages();
                        } catch (sendError) {
                            console.error('发送验证消息失败:', sendError);
                            resolve(false);
                        }
                    }

                    this.connectingPromise = null;
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('收到WebSocket消息:', data);

                        const message = parseChatMessage(data);
                        const chatStore = useChatStore.getState();
                        chatStore.addWebSocketMessage(message);
                    } catch (error) {
                        console.error('处理WebSocket消息出错:', error);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket错误:', error);
                    this.connectionState = 'closed';
                    resolve(false);
                    this.connectingPromise = null;
                };

                this.ws.onclose = (event) => {
                    console.log(`WebSocket连接关闭: ${event.code} ${event.reason}`);
                    this.connectionState = 'closed';

                    if (this.connectingPromise) {
                        resolve(false);
                        this.connectingPromise = null;
                    }

                    this.attemptReconnect();
                };
            } catch (error) {
                console.error('创建WebSocket连接失败:', error);
                this.connectionState = 'closed';
                resolve(false);
                this.connectingPromise = null;
                this.attemptReconnect();
            }
        });

        return this.connectingPromise;
    }

    // 兼容旧API的connect方法
    public connect(chatIds?: string[]): void {
        this.connectAsync().then(success => {
            if (success && chatIds && chatIds.length > 0) {
                this.joinChats(chatIds);
            }
        });
    }

    // 处理待发送的消息队列
    private processPendingMessages(): void {
        if (this.pendingMessages.length > 0 &&
            this.ws &&
            this.ws.readyState === WebSocket.OPEN) {

            console.log(`处理${this.pendingMessages.length}条待发送消息`);

            this.pendingMessages.forEach(item => {
                try {
                    this.sendMessage(item.message, item.chatId);
                } catch (e) {
                    console.error('发送待处理消息失败:', e);
                }
            });

            this.pendingMessages = [];
        }
    }

    // 尝试重新连接
    private attemptReconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('已达到最大重连次数，停止重连');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        console.log(`将在 ${delay}ms 后尝试重新连接 (尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        this.reconnectTimeout = setTimeout(() => {
            console.log('尝试重新连接...');
            this.connectAsync();
        }, delay) as unknown as number;
    }

    // 检查连接并重连
    public async checkAndReconnect(): Promise<boolean> {
        if (this.connectionState !== 'open') {
            console.log('检测到WebSocket未连接，尝试重新连接...');
            if (this.session) {
                return await this.connectAsync();
            } else {
                console.error('无法重连：缺少会话信息');
                return false;
            }
        }
        return true;
    }

    // 发送消息
    public sendMessage(message: string, chatId: string): void {
        if (this.connectionState !== 'open' || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.log('WebSocket未就绪，将消息加入待发送队列');
            this.pendingMessages.push({ message, chatId });
            this.checkAndReconnect();
            return;
        }

        if (!this.session) {
            console.error('没有有效的会话，无法发送消息');
            return;
        }

        try {
            this.ws.send(JSON.stringify({
                "type": "Chat",
                "message": message,
                "message_id": nanoid(),
                "chat_id": chatId,
                "at": new Date().toISOString()
            }));
        } catch (error) {
            console.error('发送消息失败:', error);
            // 如果发送失败，可能是连接状态问题，添加到待发送队列
            this.pendingMessages.push({ message, chatId });
            this.connectionState = 'closed'; // 强制认为连接已关闭
            this.checkAndReconnect();
        }
    }

    // 加入聊天室
    public async joinChat(chatId: string): Promise<boolean> {
        return this.joinChats([chatId]);
    }

    // 加入多个聊天室
    public async joinChats(chatIds: string[]): Promise<boolean> {
        // 确保WebSocket连接
        if (this.connectionState !== 'open' || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            try {
                const connected = await this.connectAsync();
                if (!connected) {
                    console.error('WebSocket连接失败，无法加入聊天室');
                    return false;
                }
            } catch (e) {
                console.error('连接WebSocket失败:', e);
                return false;
            }
        }

        console.log('加入聊天室:', chatIds);

        try {
            this.ws!.send(JSON.stringify({
                "type": "Join",
                "chat_id": chatIds
            }));
            return true;
        } catch (error) {
            console.error('加入聊天室失败:', error);
            this.connectionState = 'closed'; // 强制认为连接已关闭
            this.checkAndReconnect();
            return false;
        }
    }

    // 断开连接
    public disconnect(): void {
        console.log('断开WebSocket连接');

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.connectionState = 'closing';
            try {
                this.ws.close();
            } catch (e) {
                console.error('关闭WebSocket连接时出错:', e);
            }
            this.ws = null;
        }

        this.connectionState = 'closed';
        this.pendingMessages = [];
    }

    // 检查是否已连接
    public isConnected(): boolean {
        return this.connectionState === 'open' && !!this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    // 获取连接状态
    public getConnectionState(): string {
        return this.connectionState;
    }
}

export default WebSocketService.getInstance();