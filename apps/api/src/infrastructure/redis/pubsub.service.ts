export type MessageHandler = (channel: string, message: any) => void;

export class RealtimePubSubService {
  private channels: Map<string, Set<MessageHandler>> = new Map();
  private auditLog: Array<{ channel: string; message: any; time: number }> = [];

  public async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(handler);
  }

  public async unsubscribe(channel: string, handler: MessageHandler): Promise<void> {
    const handlers = this.channels.get(channel);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.channels.delete(channel);
      }
    }
  }

  public async publish(channel: string, message: any): Promise<number> {
    this.auditLog.push({ channel, message, time: Date.now() });
    const handlers = this.channels.get(channel);
    if (!handlers || handlers.size === 0) return 0;

    for (const handler of handlers) {
      try {
        handler(channel, message);
      } catch (err) {
        console.error(`PubSub error on channel ${channel}:`, err);
      }
    }
    return handlers.size;
  }

  public getSubscriberCount(channel: string): number {
    return this.channels.get(channel)?.size ?? 0;
  }

  public getRecentAuditLog(limit: number = 20): Array<{ channel: string; message: any; time: number }> {
    return this.auditLog.slice(-limit);
  }

  public clear(): void {
    this.channels.clear();
    this.auditLog = [];
  }
}
