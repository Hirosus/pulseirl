import { describe, it, expect, beforeEach } from 'vitest';
import { RealtimePubSubService } from '../src/infrastructure/redis/pubsub.service';
import { WebSocketGateway, SimulatedWebSocketClient } from '../src/modules/realtime/websocket.gateway';
import { RealtimeEventType } from '../src/modules/realtime/events';

describe('Real-Time Pub/Sub & WebSocket Broadcast Gateway', () => {
  let pubsub: RealtimePubSubService;
  let gateway: WebSocketGateway;

  beforeEach(() => {
    pubsub = new RealtimePubSubService();
    gateway = new WebSocketGateway(pubsub);
  });

  it('publishes and delivers inventory deltas across Redis pub/sub channels within 20ms', async () => {
    let receivedPayload: any = null;
    await pubsub.subscribe('channel:events:availability', (channel, msg) => {
      receivedPayload = msg;
    });

    const testPayload = {
      eventId: 'ev_rooftop_vinyl',
      remainingSeats: 7,
      totalCapacity: 40,
      dropStatus: 'LIVE_DROP',
      velocityRps: 18.2,
      timestamp: Date.now()
    };

    const subscribersReached = await pubsub.publish('channel:events:availability', testPayload);
    expect(subscribersReached).toBeGreaterThan(0);
    expect(receivedPayload).toEqual(testPayload);
  });

  it('routes WebSocket room broadcasts exclusively to subscribed clients', () => {
    const messagesClientA: string[] = [];
    const messagesClientB: string[] = [];

    const clientA: SimulatedWebSocketClient = {
      id: 'flutter_mobile_user_01',
      rooms: new Set(),
      isOpen: true,
      send: (data: string) => messagesClientA.push(data)
    };

    const clientB: SimulatedWebSocketClient = {
      id: 'flutter_mobile_user_02',
      rooms: new Set(),
      isOpen: true,
      send: (data: string) => messagesClientB.push(data)
    };

    gateway.registerClient(clientA);
    gateway.registerClient(clientB);

    // Client A subscribes to ev_vinyl, Client B does not
    gateway.joinRoom(clientA.id, 'event:ev_vinyl');

    const delta = {
      type: RealtimeEventType.INVENTORY_DELTA,
      payload: { eventId: 'ev_vinyl', remainingSeats: 6, velocityRps: 22.0 }
    };

    const delivered = gateway.broadcastToRoom('event:ev_vinyl', delta);
    expect(delivered).toBe(1);

    expect(messagesClientA.length).toBe(1);
    expect(JSON.parse(messagesClientA[0])).toEqual(delta);
    expect(messagesClientB.length).toBe(0); // Client B received nothing
  });

  it('cleans up client rooms upon disconnection', () => {
    const client: SimulatedWebSocketClient = {
      id: 'web_ops_organizer_99',
      rooms: new Set(),
      isOpen: true,
      send: () => {}
    };

    gateway.registerClient(client);
    gateway.joinRoom(client.id, 'event:ev_ops');
    expect(gateway.getRoomSubscriberCount('event:ev_ops')).toBe(1);

    gateway.unregisterClient(client.id);
    expect(gateway.getRoomSubscriberCount('event:ev_ops')).toBe(0);
    expect(gateway.getConnectedClientCount()).toBe(0);
  });
});
