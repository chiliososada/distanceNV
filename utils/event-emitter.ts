// utils/event-emitter.ts
type EventHandler = (data?: any) => void;

class EventEmitter {
    private events: Map<string, EventHandler[]> = new Map();

    on(event: string, handler: EventHandler): () => void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event)!.push(handler);

        return () => this.off(event, handler);
    }

    off(event: string, handler: EventHandler): void {
        if (!this.events.has(event)) return;

        const handlers = this.events.get(event)!;
        const index = handlers.indexOf(handler);

        if (index !== -1) {
            handlers.splice(index, 1);
        }

        if (handlers.length === 0) {
            this.events.delete(event);
        }
    }

    emit(event: string, data?: any): void {
        if (!this.events.has(event)) return;

        this.events.get(event)!.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`事件处理器出错 (${event}):`, error);
            }
        });
    }

    clear(): void {
        this.events.clear();
    }
}

export default new EventEmitter();