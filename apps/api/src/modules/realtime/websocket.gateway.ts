import { RealtimePubSubService } from '../../infrastructure/redis/pubsub.service';
import { RealtimeEventType, InventoryDeltaPayload } from './events';

export interface SimulatedWebSocketClient {
  id: string;
  rooms: Set<string>;
  send: (data: string) => void;
  isOpen: boolean;
}

export class WebSocketGateway {
  private pubsub: RealtimePubSubService;
  private clients: Map<string, SimulatedWebSocketClient> = new Map();
  private roomSubscribers: Map<string, Set<string>> = new Map(); // room -> clientIds

  constructor(pubsub: RealtimePubSubService) {
    this.pubsub = pubsub;
    this.initPubSubListeners();
  }

  private initPubSubListeners(): void {
    // Forward Redis Pub/Sub events directly to connected room clients
    this.pubsub.subscribe('channel:events:availability', (channel, payload: InventoryDeltaPayload) => {
      this.broadcastToRoom(`event:${payload.eventId}`, {
        type: RealtimeEventType.INVENTORY_DELTA,
        payload
      });
    });
  }

  public registerClient(client: SimulatedWebSocketClient): void {
    this.clients.set(client.id, client);
  }

  public unregisterClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      for (const room of client.rooms) {
        this.roomSubscribers.get(room)?.delete(clientId);
      }
      this.clients.delete(clientId);
    }
  }

  public joinRoom(clientId: string, room: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    client.rooms.add(room);
    if (!this.roomSubscribers.has(room)) {
      this.roomSubscribers.set(room, new Set());
    }
    this.roomSubscribers.get(room)!.add(clientId);
    return true;
  }

  public leaveRoom(clientId: string, room: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    client.rooms.delete(room);
    this.roomSubscribers.get(room)?.delete(clientId);
    return true;
  }

  public broadcastToRoom(room: string, message: { type: RealtimeEventType; payload: any }): number {
    const clientIds = this.roomSubscribers.get(room);
    if (!clientIds || clientIds.size === 0) return 0;

    const serialized = JSON.stringify(message);
    let sentCount = 0;

    for (const clientId of clientIds) {
      const client = this.clients.get(clientId);
      if (client && client.isOpen) {
        client.send(serialized);
        sentCount++;
      }
    }
    return sentCount;
  }

  public getConnectedClientCount(): number {
    return this.clients.size;
  }

  public getRoomSubscriberCount(room: string): number {
    return this.roomSubscribers.get(room)?.size ?? 0;
  }
}
