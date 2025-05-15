// services/websocket-service.ts
import { nanoid } from 'nanoid';
import { useChatStore } from '@/store/chat-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 聊天消息类型
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

// 会话类型
export interface Session {
    uid: string;
    chat_token: string;
    chat_url: string;
    display_name: string;
    photo_url?: string;
}

// 解析聊天消息
const parseChatMessage = (data: any): ChatMessage => {
    if (!data || typeof data !== 'object') {
        throw new Error('无效的消息格式');
    }

    // 验证必要字段
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

    // 单例模式
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

        // 保存会话信息到AsyncStorage
        try {
            AsyncStorage.setItem('websocket-session', JSON.stringify(session));
        } catch (error) {
            console.error('保存WebSocket会话信息失败:', error);
        }
    }

    // 连接WebSocket
    public connect(chatIds?: string[]): void {
        if (!this.session) {
            console.error('尝试在没有会话的情况下连接WebSocket');
            return;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket已连接');
            return;
        }

        console.log(`正在连接到WebSocket: ${this.session.chat_url}`);

        try {
            const session = this.session; // 保存会话引用以在回调中使用
            this.ws = new WebSocket(this.session.chat_url);

            this.ws.onopen = () => {
                console.log(`已连接到WebSocket: ${session.chat_url}`);

                // 发送验证消息
                if (this.ws && this.session) {
                    this.ws.send(JSON.stringify({
                        "type": "Validate",
                        "user_id": this.session.uid,
                        "token": this.session.chat_token,
                    }));

                    // 如果提供了聊天室ID，则加入
                    if (chatIds && chatIds.length > 0) {
                        this.joinChats(chatIds);
                    }
                }

                // 重置重连尝试
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('收到WebSocket消息:', data);

                    const message = parseChatMessage(data);

                    // 将消息添加到聊天存储
                    const chatStore = useChatStore.getState();
                    chatStore.addWebSocketMessage(message);
                } catch (error) {
                    console.error('处理WebSocket消息出错:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket错误:', error);
            };

            this.ws.onclose = (event) => {
                console.log(`WebSocket连接关闭: ${event.code} ${event.reason}`);

                // 尝试重新连接
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('创建WebSocket连接失败:', error);
            this.attemptReconnect();
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

        // 保存setTimeout返回的数字ID
        this.reconnectTimeout = setTimeout(() => {
            console.log('尝试重新连接...');
            this.connect();
        }, delay) as unknown as number;
    }

    public checkAndReconnect(): boolean {
        if (!this.isConnected()) {
            console.log('检测到WebSocket未连接，尝试重新连接...');
            if (this.session) {
                this.connect();
                return true;
            } else {
                console.error('无法重连：缺少会话信息');
                return false;
            }
        }
        return true;
    }
    // 发送消息
    public sendMessage(message: string, chatId: string): void {
        if (!this.checkAndReconnect()) {
            console.error('WebSocket未连接，无法发送消息');
            return;
        }

        if (!this.session) {
            console.error('没有有效的会话，无法发送消息');
            return;
        }

        // const messageData = {
        //     "type": "Chat",
        //     "message": message,
        //     "message_id": nanoid(),
        //     "chat_id": chatId,
        //     "at": new Date().toISOString(),
        //     "user_id": this.session.uid,
        //     "nickname": this.session.display_name,
        //     "avatar_url": this.session.photo_url
        // };

        this.ws.send(JSON.stringify({
            "type": "Chat",
            "message": message,
            "message_id": nanoid(),
            "chat_id": chatId,
            "at": new Date().toISOString()
        }));

        // 将自己发送的消息也添加到聊天存储
        // const chatStore = useChatStore.getState();
        //chatStore.addWebSocketMessage(messageData);
    }

    // 加入聊天室
    public joinChat(chatId: string): void {
        this.joinChats([chatId]);
    }

    // 加入多个聊天室
    public joinChats(chatIds: string[]): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket未连接，无法加入聊天室');
            return;
        }

        console.log('加入聊天室:', chatIds);

        this.ws.send(JSON.stringify({
            "type": "Join",
            "chat_id": chatIds
        }));
    }

    // 断开连接
    public disconnect(): void {
        console.log('断开WebSocket连接');

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    // 检查是否已连接
    public isConnected(): boolean {
        return !!this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

export default WebSocketService.getInstance();