# RFC-001: Two-Phase Inventory Reservation & Concurrency Control

**Author:** Olaiya Damilola Solomon (`Hirosus`)  
**Status:** Approved & Implemented  
**Scope:** `apps/api/src/modules/booking`, `PostgreSQL`, `Redis`  

---

## 1. Context & Problem Statement

PulseIRL facilitates spontaneous flash-event ticket drops where high demand creates massive concurrency spikes (e.g., 50 spots released at 20:00 WAT, resulting in 5,000+ simultaneous requests in under 2 seconds).

A naive database design relying on standard SQL queries introduces catastrophic failure modes:
1. **Lost Updates & Overselling (Race Condition):** Two concurrent transactions reading `available_seats = 1` both succeed in issuing tickets, driving available inventory to `-1`.
2. **Database Connection Pool Exhaustion:** Direct transactional locking on PostgreSQL under 5,000 RPS causes catastrophic lock contention, query timeouts, and cascading server failure.
3. **Double-Booking from Client Retries:** Cellular network jitter in urban centers like Lagos leads to client retries, risking duplicate ticket purchases and double-charges.

---

## 2. Proposed Architecture: Two-Phase Hybrid Reservation

To eliminate race conditions while protecting database throughput, we engineered a **Two-Phase Reservation Engine**:

```
                       User Request (POST /api/bookings/hold)
                                       │
                                       ▼
                     Phase 1: Redis Hot-Path Lock Acquisition
                     ┌──────────────────────────────────────┐
                     │ Atomic Lua Script Execution          │
                     │ - Check capacity:event:id            │
                     │ - DECRBY 1                           │
                     │ - HSET reserve:event:user (TTL: 300s)│
                     └──────────────────┬───────────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
                 [Capacity > 0]                 [Capacity == 0]
                 Lock Granted (<2ms)            409 Conflict (<1ms)
                 5-Minute TTL Lease             Graceful Rejection
                         │
                         ▼
        User Completes Checkout (POST /api/bookings/confirm)
                         │
                         ▼
                     Phase 2: PostgreSQL ACID Settlement
                     ┌──────────────────────────────────────┐
                     │ BEGIN TRANSACTION;                  │
                     │ - Verify Idempotency Key             │
                     │ - SELECT id FROM event_slots         │
                     │   WHERE event_id = $1                │
                     │   AND status = 'AVAILABLE'           │
                     │   LIMIT 1 FOR UPDATE;                │
                     │ - UPDATE slot SET status='CONFIRMED' │
                     │ - INSERT INTO bookings (...)         │
                     │ COMMIT;                              │
                     └──────────────────┬───────────────────┘
                                        │
                                        ▼
                     Release Redis Lease & Issue Pass
```

### Phase 1: Sub-Millisecond In-Memory Reservation (Redis Lua)
- Inventory capacity is cached as an atomic counter in Redis: `event:{eventId}:available`.
- An atomic Lua script decrements the counter and establishes a lease hash with a 300-second (5 minute) TTL:
  ```lua
  if redis.call('EXISTS', leaseKey) == 1 then
    return {0, -1, 'USER_ALREADY_HOLDS_LEASE'}
  end
  local current = tonumber(redis.call('GET', capKey) or '-1')
  if current >= reqSlots then
    local remaining = redis.call('DECRBY', capKey, reqSlots)
    redis.call('HSET', leaseKey, 'userId', userId, 'slots', reqSlots)
    redis.call('EXPIRE', leaseKey, ttl)
    return {1, remaining, 'LEASE_ACQUIRED'}
  else
    return {0, current, 'CAPACITY_EXHAUSTED'}
  end
  ```
- **Throughput:** Redis processes up to 80,000 operations/sec in memory with single-threaded atomicity. If inventory is exhausted, requests fail in sub-2ms without opening a database transaction.

### Phase 2: Relational Settlement (PostgreSQL `SELECT ... FOR UPDATE`)
- Once payment or one-tap confirmation completes, the backend commits the record inside a PostgreSQL transaction.
- Row-level locking via `SELECT ... FOR UPDATE` isolates specific physical seat rows, preventing phantom reads and guaranteeing 100% relational integrity.
- Unique database constraints on `idempotency_key` prevent duplicate tickets during cellular network retries.

### Lease Expiration Worker
If a user closes their phone during the 5-minute checkout hold, a lightweight background worker queries expired Redis keys and runs `release_slot.lua`, replenishing the available inventory counter and publishing a WebSocket delta broadcast.

---

## 3. Concurrency Stress Test Results

Executed via `vitest` and `autocannon` under simulated load:

| Scenario | Concurrency | Total Requests | Total Available | Confirmed Bookings | Oversell Violations | P99 Latency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Flash Drop Peak** | 100 concurrent | 100 | 5 | **5** | **0 (0.00%)** | 8.4ms |
| **Stress Spike** | 500 concurrent | 5,000 | 50 | **50** | **0 (0.00%)** | 18.2ms |
