// services/websocket-service.ts
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
    private pendingChats: Set<string> = new Set();
    private connectionState: 'closed' | 'connecting' | 'open' | 'closing' = 'closed';
    private heartbeatInterval: number | null = null;
    private lastPingTime = 0;

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
        if (this.connectionState === 'open' && this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket已连接');
            return true;
        }

        if (this.connectionState === 'connecting' && this.connectingPromise) {
            console.log('WebSocket正在连接中...');
            return this.connectingPromise;
        }

        if (!this.session) {
            console.error('尝试在没有会话的情况下连接WebSocket');
            return Promise.resolve(false);
        }

        this.connectionState = 'connecting';
        console.log(`正在连接到WebSocket: ${this.session.chat_url}`);

        this.connectingPromise = new Promise((resolve) => {
            try {
                const session = this.session;

                // 关闭现有连接
                this.closeConnection();

                // 创建新连接
                this.ws = new WebSocket(session!.chat_url);

                this.ws.onopen = () => {
                    console.log(`已连接到WebSocket: ${session!.chat_url}`);
                    this.connectionState = 'open';

                    // 发送验证消息
                    if (this.ws && this.session) {
                        try {
                            this.ws.send(JSON.stringify({
                                "type": "Validate",
                                "user_id": this.session.uid,
                                "token": this.session.chat_token,
                            }));

                            // 重置重连尝试
                            this.reconnectAttempts = 0;

                            // 开始心跳检测
                            this.startHeartbeat();

                            resolve(true);

                            // 处理等待的消息和聊天室
                            this.processPendingMessages();
                            this.processPendingChats();
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

                        // 处理心跳响应
                        if (data.type === 'Pong') {
                            this.handlePong();
                            return;
                        }

                        console.log('收到WebSocket消息:', data);

                        // 处理聊天消息
                        if (data.type === 'Chat') {
                            const message = parseChatMessage(data);
                            const chatStore = useChatStore.getState();
                            chatStore.addWebSocketMessage(message);
                        }
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
                    this.stopHeartbeat();

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

    // 关闭现有连接
    private closeConnection(): void {
        if (this.ws) {
            this.ws.onclose = null; // 移除旧事件处理器
            this.ws.onerror = null;
            this.ws.onmessage = null;
            this.ws.onopen = null;

            try {
                if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                    this.ws.close();
                }
            } catch (error) {
                console.error('关闭WebSocket连接出错:', error);
            }

            this.ws = null;
        }
    }

    // 启动心跳检测
    private startHeartbeat(): void {
        this.stopHeartbeat();

        this.lastPingTime = Date.now();

        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                try {
                    this.ws.send(JSON.stringify({
                        "type": "Ping",
                        "timestamp": Date.now().toString()
                    }));
                    this.lastPingTime = Date.now();
                } catch (error) {
                    console.error('发送心跳包失败:', error);

                    // 如果发送失败且超过30秒无响应，尝试重连
                    if (Date.now() - this.lastPingTime > 30000) {
                        console.log('WebSocket心跳检测超时，尝试重连');
                        this.reconnect();
                    }
                }
            } else {
                // 连接不可用，尝试重连
                this.reconnect();
            }
        }, 15000) as unknown as number; // 每15秒发送一次心跳包
    }

    // 停止心跳检测
    private stopHeartbeat(): void {
        if (this.heartbeatInterval !== null) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // 处理心跳响应
    private handlePong(): void {
        // 更新最后响应时间
        this.lastPingTime = Date.now();
    }

    // 兼容旧API的connect方法
    public connect(chatIds?: string[]): void {
        this.connectAsync().then(success => {
            if (success && chatIds && chatIds.length > 0) {
                this.joinChats(chatIds);
            }
        });
    }

    // 手动重连
    public reconnect(): void {
        this.closeConnection();
        this.connectionState = 'closed';
        this.connectAsync();
    }

    // 处理待发送的消息队列
    private processPendingMessages(): void {
        if (this.pendingMessages.length > 0 &&
            this.ws &&
            this.ws.readyState === WebSocket.OPEN) {

            console.log(`处理${this.pendingMessages.length}条待发送消息`);

            // 创建临时副本，避免在迭代过程中修改原数组
            const messagesToSend = [...this.pendingMessages];
            this.pendingMessages = [];

            messagesToSend.forEach(item => {
                try {
                    this.sendMessage(item.message, item.chatId);
                } catch (e) {
                    console.error('发送待处理消息失败:', e);
                    // 失败时，重新添加到待处理队列
                    this.pendingMessages.push(item);
                }
            });
        }
    }

    // 处理待加入的聊天室
    private processPendingChats(): void {
        if (this.pendingChats.size > 0 &&
            this.ws &&
            this.ws.readyState === WebSocket.OPEN) {

            console.log(`处理${this.pendingChats.size}个待加入聊天室`);

            const chatIds = Array.from(this.pendingChats);
            this.pendingChats.clear();

            try {
                this.ws.send(JSON.stringify({
                    "type": "Join",
                    "chat_id": chatIds
                }));
            } catch (error) {
                console.error('加入聊天室失败:', error);
                // 失败时，重新添加到待处理集合
                chatIds.forEach(id => this.pendingChats.add(id));
            }
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
        const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5); // 最大延迟15秒

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

                // 尝试从AsyncStorage恢复会话
                try {
                    const storedSession = await AsyncStorage.getItem('websocket-session');
                    if (storedSession) {
                        this.session = JSON.parse(storedSession);
                        return await this.connectAsync();
                    }
                } catch (error) {
                    console.error('恢复会话失败:', error);
                }

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
            this.reconnect();
        }
    }

    // 加入聊天室
    public async joinChat(chatId: string): Promise<boolean> {
        return this.joinChats([chatId]);
    }

    // 加入多个聊天室
    public async joinChats(chatIds: string[]): Promise<boolean> {
        if (!chatIds || chatIds.length === 0) {
            return true;
        }

        // 过滤掉无效的聊天ID
        const validChatIds = chatIds.filter(id => id && typeof id === 'string');

        if (validChatIds.length === 0) {
            return true;
        }

        // 确保WebSocket连接
        if (this.connectionState !== 'open' || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.log('WebSocket未连接，将聊天室加入待处理列表');

            // 添加到待加入集合
            validChatIds.forEach(id => this.pendingChats.add(id));

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

        console.log('加入聊天室:', validChatIds);

        try {
            this.ws!.send(JSON.stringify({
                "type": "Join",
                "chat_id": validChatIds
            }));
            return true;
        } catch (error) {
            console.error('加入聊天室失败:', error);

            // 添加到待加入集合
            validChatIds.forEach(id => this.pendingChats.add(id));

            this.reconnect();
            return false;
        }
    }

    // 断开连接
    public disconnect(): void {
        console.log('断开WebSocket连接');

        this.stopHeartbeat();

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