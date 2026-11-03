# RFC-002: Real-Time Pub/Sub & WebSocket Broadcast Architecture

**Author:** Olaiya Damilola Solomon (`Hirosus`)  
**Status:** Approved & Implemented  
**Scope:** `apps/api/src/modules/realtime`, `apps/web`, `apps/mobile`  

---

## 1. Context & Motivation

In high-demand event drops, attendees watching the mobile app countdown require sub-second inventory feedback. If 8 tickets remain and 3 are reserved, the counter must tick down from 8 to 5 in near real time across thousands of devices.

Polling the REST API via HTTP intervals (e.g. every 2 seconds per client) creates massive server load ($5,000 \text{ clients} \times 0.5 \text{ req/sec} = 2,500 \text{ RPS}$) and burns metered mobile data in emerging markets.

---

## 2. Proposed Architecture

We implemented a **Redis Pub/Sub Event Backbone** coupled with a **Node.js WebSocket Broadcast Gateway**:

```
 [Event Mutation Engine] ───► Redis Pub/Sub Channel ───► [WebSocket Cluster Nodes]
                                    │                             │
                                    ▼                             ▼
                        channel:events:availability       Room: event:ev_99182
                                                                  │
                                            ┌─────────────────────┴─────────────────────┐
                                            ▼                                           ▼
                                [Flutter Mobile Clients]                    [Next.js 14 Web Portal]
```

### Protocol & State Sync
1. **Room Subscription:** When a client opens an event screen, it emits `{ action: "join", room: "event:ev_1" }`. The gateway attaches the socket to that specific room set.
2. **Delta Payload:** State updates are minimal JSON objects (`{ type: "INVENTORY_DELTA", payload: { remainingSeats, dropStatus, velocityRps } }`), averaging < 120 bytes per frame.
3. **Heartbeat Protocol:** Clients emit a ping every 30 seconds; missing two consecutive pings triggers socket cleanup and room de-registration to eliminate dead subscriber leaks.
