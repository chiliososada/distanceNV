// services/websocket-service.ts
import { nanoid } from 'nanoid/non-secure'; // 使用non-secure版本，不依赖crypto
import { useChatStore } from '@/store/chat-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventEmitter from '@/utils/event-emitter';

export interface ChatMessage {
    type: string;
    message: string;
    message_id: string;
    chat_id: string;
    user_id?: string;
    at: string;
    nickname?: string;
    avatar_url?: string;
    img_url?: string; // 添加图片URL字段
}

export interface Session {
    uid: string;
    chat_token: string;
    chat_url: string;
    display_name: string;
    photo_url?: string;
}

type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'closing';
type ConnectionStatusListener = (status: ConnectionStatus) => void;
type MessageListener = (message: ChatMessage) => void;


class WebSocketService {
    private static instance: WebSocketService;
    private ws: WebSocket | null = null;
    private session: Session | null = null;
    private pendingMessages: Array<{ chatId: string, message: string, imgUrl?: string }> = [];
    private pendingChats: Set<string> = new Set();
    private connectionState: ConnectionStatus = 'disconnected';
    private connectionStatusListeners: ConnectionStatusListener[] = [];
    private messageListeners: MessageListener[] = [];

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    private constructor() { }

    // 添加连接状态变化监听器
    public onConnectionStatusChange(listener: ConnectionStatusListener): () => void {
        this.connectionStatusListeners.push(listener);

        // 立即通知当前状态
        listener(this.connectionState);

        // 返回解除监听的函数
        return () => {
            this.connectionStatusListeners =
                this.connectionStatusListeners.filter(l => l !== listener);
        };
    }

    // 添加消息监听器
    public onMessage(listener: MessageListener): () => void {
        this.messageListeners.push(listener);
        console.log('添加消息监听器, 当前监听器数量:', this.messageListeners.length);

        // 立即返回解除监听的函数
        return () => {
            console.log('移除消息监听器');
            this.messageListeners = this.messageListeners.filter(l => l !== listener);
            console.log('移除后监听器数量:', this.messageListeners.length);
        };
    }


    private createChatMessage(data: any): ChatMessage {
        // 返回一个格式标准的消息对象，确保所有必要字段都有默认值
        return {
            type: data.type || 'Chat', // 如果没有type字段，则默认为"Chat"
            message: data.message || '',
            message_id: data.message_id,
            chat_id: data.chat_id,
            user_id: data.user_id || '',
            at: data.at || new Date().toISOString(),
            nickname: data.nickname || '',
            avatar_url: data.avatar_url || '',
            img_url: data.img_url
        };
    }

    // 触发状态变化
    private triggerConnectionStatusChange(status: ConnectionStatus): void {
        this.connectionState = status;
        this.connectionStatusListeners.forEach(listener => {
            try {
                listener(status);
            } catch (e) {
                console.error('连接状态监听器异常:', e);
            }
        });
    }

    // 触发消息接收
    private triggerMessageReceived(message: ChatMessage): void {
        console.log('触发消息接收事件, 监听器数量:', this.messageListeners.length);
        this.messageListeners.forEach(listener => {
            try {
                listener(message);
                console.log('消息监听器已执行');
            } catch (e) {
                console.error('消息监听器异常:', e);
            }
        });
    }

    // 初始化会话信息
    public initialize(session: Session): void {
        this.session = session;
        this.triggerConnectionStatusChange('disconnected');

        try {
            AsyncStorage.setItem('websocket-session', JSON.stringify(session));
        } catch (error) {
            console.error('保存WebSocket会话信息失败:', error);
        }
    }

    // 连接WebSocket并返回Promise
    public async connectAsync(): Promise<boolean> {
        // 如果已连接，直接返回成功
        if (this.connectionState === 'connected' && this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket已连接');
            return true;
        }

        // 如果正在连接中，等待连接完成
        if (this.connectionState === 'connecting' && this.connectingPromise) {
            console.log('WebSocket正在连接中...');
            return this.connectingPromise;
        }

        // 检查会话信息
        if (!this.session) {
            console.error('尝试在没有会话的情况下连接WebSocket');

            // 尝试从AsyncStorage恢复会话
            try {
                const storedSession = await AsyncStorage.getItem('websocket-session');
                if (storedSession) {
                    this.session = JSON.parse(storedSession);
                } else {
                    return false;
                }
            } catch (error) {
                console.error('恢复会话失败:', error);
                return false;
            }
        }

        // 设置连接状态
        this.triggerConnectionStatusChange('connecting');

        // 添加超时机制：30秒后自动返回false
        const connectionTimeoutMs = 30000; // 30秒
        let timeoutId: number | null = null;

        const connectingPromise = new Promise<boolean>((resolve) => {
            // 设置超时，防止永久挂起
            timeoutId = setTimeout(() => {
                console.error(`WebSocket连接超时 (${connectionTimeoutMs}ms)`);
                this.triggerConnectionStatusChange('disconnected');
                resolve(false);
            }, connectionTimeoutMs) as unknown as number;

            try {
                const session = this.session;

                // 关闭现有连接
                this.closeConnection();

                // 创建新连接
                this.ws = new WebSocket(session!.chat_url);

                this.ws.onopen = () => {
                    if (timeoutId !== null) {
                        clearTimeout(timeoutId);
                    }

                    console.log(`已连接到WebSocket: ${session!.chat_url}`);
                    this.triggerConnectionStatusChange('connected');

                    // 发送验证消息
                    if (this.ws && this.session) {
                        try {
                            this.ws.send(JSON.stringify({
                                "type": "Validate",
                                "user_id": this.session.uid,
                                "token": this.session.chat_token,
                            }));

                            resolve(true);

                            // 处理待处理消息和聊天室
                            this.processPendingMessages();
                            this.processPendingChats();
                        } catch (sendError) {
                            console.error('发送验证消息失败:', sendError);
                            this.triggerConnectionStatusChange('disconnected');
                            resolve(false);
                        }
                    }
                };

                this.ws.onmessage = (event) => {
                    try {
                        console.log('收到原始WebSocket消息:', event.data);
                        const data = JSON.parse(event.data);
                        console.log('解析后的WebSocket消息:', data);

                        // 修改：检查消息是否包含必要字段，不再只依赖type字段
                        if (data.message_id && data.chat_id) {
                            console.log('识别到聊天消息, 开始处理');
                            // 确保数据有type字段，如果没有则添加
                            if (!data.type) {
                                data.type = 'Chat';
                            }
                            const message = this.createChatMessage(data);
                            console.log('准备触发消息监听器, 当前监听器数量:', this.messageListeners.length);
                            this.triggerMessageReceived(message);
                        }
                    } catch (error) {
                        console.error('处理WebSocket消息出错:', error, '原始数据:', event.data);
                    }
                };

                this.ws.onerror = (error) => {
                    if (timeoutId !== null) {
                        clearTimeout(timeoutId);
                    }

                    console.error('WebSocket错误:', error);
                    this.triggerConnectionStatusChange('disconnected');
                    resolve(false);
                };

                this.ws.onclose = (event) => {
                    if (timeoutId !== null) {
                        clearTimeout(timeoutId);
                    }

                    console.log(`WebSocket连接关闭: ${event.code} ${event.reason}`);
                    this.triggerConnectionStatusChange('disconnected');
                    this.notifyConnectionLost();
                    resolve(false);
                };
            } catch (error) {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }

                console.error('创建WebSocket连接失败:', error);
                this.triggerConnectionStatusChange('disconnected');
                resolve(false);
            }
        });

        this.connectingPromise = connectingPromise;
        return connectingPromise;
    }

    // 连接Promise 保存
    private connectingPromise: Promise<boolean> | null = null;

    // 关闭现有连接
    private closeConnection(): void {
        if (this.ws) {
            this.ws.onclose = null; // 移除旧事件处理器
            this.ws.onerror = null;
            this.ws.onmessage = null;
            this.ws.onopen = null;

            try {
                if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                    this.triggerConnectionStatusChange('closing');
                    this.ws.close();
                }
            } catch (error) {
                console.error('关闭WebSocket连接出错:', error);
            }

            this.ws = null;
        }
    }

    // 兼容旧API的connect方法
    public connect(chatIds?: string[]): void {
        this.connectAsync().then(success => {
            if (success && chatIds && chatIds.length > 0) {
                this.joinChats(chatIds);
            }
        });
    }

    // 处理待发送消息
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
                    if (item.imgUrl) {
                        this.sendMessage(item.message, item.chatId, item.imgUrl);
                    } else {
                        this.sendMessage(item.message, item.chatId);
                    }
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

    // 通知连接已丢失
    private notifyConnectionLost(): void {
        // 发布连接丢失事件
        try {
            const eventData = {
                type: 'connection_lost',
                timestamp: new Date().toISOString()
            };
            EventEmitter.emit('WEBSOCKET_CONNECTION_LOST', eventData);
        } catch (e) {
            console.error('发送连接丢失通知失败:', e);
        }
    }

    // 发送消息
    public sendMessage(message: string, chatId: string, imgUrl?: string): void {
        if (this.connectionState !== 'connected' || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.log('WebSocket未就绪，将消息加入待发送队列');
            this.pendingMessages.push({ message, chatId, imgUrl });
            console.log('消息将在下次连接时发送');
            return;
        }

        if (!this.session) {
            console.error('没有有效的会话，无法发送消息');
            return;
        }

        try {
            // 创建消息对象
            const messageData = {
                "type": "Chat",
                "message": message,
                "message_id": nanoid(),
                "chat_id": chatId,
                "at": new Date().toISOString()
            };

            // 如果有图片URL，添加对应字段
            if (imgUrl) {
                // 根据后端接受的字段进行修改，假设后端使用 image_url
                //   messageData["image_url"] = imgUrl;
            }

            // 实际发送消息到服务器
            this.ws.send(JSON.stringify(messageData));
            console.log('WebSocket消息已发送:', messageData);

            // 手动触发本地消息事件，确保即使服务器不响应也能看到消息
            // 这段代码很重要，如果服务器不及时响应，用户仍然可以看到自己的消息
            // const localMessage: ChatMessage = {
            //     ...messageData,
            //     user_id: this.session.uid,
            //     nickname: this.session.display_name,
            //     avatar_url: this.session.photo_url,
            //     img_url: imgUrl
            // };
            // this.triggerMessageReceived(localMessage);

        } catch (error) {
            console.error('发送消息失败:', error);
            this.pendingMessages.push({ message, chatId, imgUrl });
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

        // 添加到待加入集合（无论连接状态如何都先添加）
        validChatIds.forEach(id => this.pendingChats.add(id));

        // 确保WebSocket连接
        if (this.connectionState !== 'connected' || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.log('WebSocket未连接，尝试连接后加入聊天室');

            // 设置连接超时
            const connectionTimeoutMs = 10000; // 10秒
            const connectPromise = this.connectAsync();
            const timeoutPromise = new Promise<boolean>(resolve => {
                setTimeout(() => {
                    console.log('加入聊天室超时');
                    resolve(false);
                }, connectionTimeoutMs);
            });

            // 使用Promise.race竞争超时
            try {
                const connected = await Promise.race([connectPromise, timeoutPromise]);
                if (!connected) {
                    console.error('WebSocket连接失败或超时，将在下次连接时处理待加入的聊天室');
                    return false;
                }
            } catch (e) {
                console.error('连接WebSocket失败:', e);
                return false;
            }
        }

        console.log('加入聊天室:', validChatIds);

        try {
            // 设置操作超时保护
            const sendTimeoutMs = 5000; // 5秒
            let success = false;

            // 使用带超时的Promise
            await Promise.race([
                new Promise<void>(resolve => {
                    this.ws!.send(JSON.stringify({
                        "type": "Join",
                        "chat_id": validChatIds
                    }));
                    success = true;
                    resolve();
                })
                ,
                new Promise<void>(resolve => {
                    setTimeout(() => {
                        console.log('发送加入聊天室请求超时');
                        resolve();
                    }, sendTimeoutMs);
                })
            ]);

            return success;
        } catch (error) {
            console.error('加入聊天室失败:', error);
            return false;
        }
    }

    // 断开连接
    public disconnect(): void {
        console.log('断开WebSocket连接');

        if (this.ws) {
            this.triggerConnectionStatusChange('closing');
            try {
                this.ws.close();
            } catch (e) {
                console.error('关闭WebSocket连接时出错:', e);
            }
            this.ws = null;
        }

        this.triggerConnectionStatusChange('disconnected');
    }

    // 检查是否已连接
    public isConnected(): boolean {
        return this.connectionState === 'connected' && !!this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    // 获取连接状态
    public getConnectionState(): ConnectionStatus {
        return this.connectionState;
    }
}

export default WebSocketService.getInstance();