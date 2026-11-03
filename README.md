# PulseIRL: Real-Time Social Meetup & High-Concurrency Reservation Platform

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)]()
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B.svg)]()
[![License](https://img.shields.io/badge/license-MIT-purple.svg)]()

> **PulseIRL** is an enterprise-grade social event and flash-meetup platform engineered for real-life human connection. Built to solve high-demand ticketing spikes, zero-drift concurrency locking, sub-second live availability broadcasts, and data-driven product experimentation.

🎮 **Live Interactive Experience:** [https://hirosus.github.io/pulseirl/](https://hirosus.github.io/pulseirl/) *(Explore the interactive Flutter mobile pass & Next.js operational terminal in your browser)*

---

## 🏛️ System Architecture

PulseIRL is organized as an enterprise monorepo featuring an event-driven Node.js/TypeScript backend, PostgreSQL with PostGIS spatial indexing, Redis in-memory concurrency buffer, a Next.js 14 operational terminal, and a Flutter mobile client.

```
                    ┌────────────────────────────────────────────────────────┐
                    │                      PulseIRL                          │
                    └────────────────────────────────────────────────────────┘
                                   ▲                            ▲
                                   │ HTTPS / WSS                │ HTTPS / WSS
                                   │                            │
                     ┌─────────────┴────────────┐  ┌────────────┴─────────────┐
                     │   Flutter Mobile Client  │  │  Next.js 14 Web Portal    │
                     │  (Attendee Experience)   │  │   (Host Ops & Analytics)  │
                     └─────────────┬────────────┘  └────────────┬─────────────┘
                                   │                            │
                                   └─────────────┬──────────────┘
                                                 │
                                                 ▼
                     ┌────────────────────────────────────────────────────────┐
                     │          Node.js + TypeScript API Gateway              │
                     │   - Fastify / Express + Zod Schema Validation          │
                     │   - Feature Flag Engine & Experiment Allocator         │
                     │   - WebSocket Gateway (Socket.io / ws)                 │
                     │   - AI Vibe Matchmaker Service                         │
                     └─────────────┬───────────────────────────┬──────────────┘
                                   │                           │
                    Redis Cache & Lock Buffer      PostgreSQL (ACID Core)
               ┌───────────────────┴───────┐     ┌─────────────┴──────────────┐
               │ - Atomic Lua Decrement    │     │ - Event Slots Inventory    │
               │ - 5-min Reservation TTL   │     │ - SELECT ... FOR UPDATE    │
               │ - Pub/Sub Event Bus       │     │ - Idempotency Keys         │
               │ - Feature Flags Cache     │     │ - PostGIS Geospatial Index │
               └───────────────────────────┘     │ - Immutable Audit Ledger   │
                                                 └────────────────────────────┘
```

---

## ⚡ Key Technical Innovations

### 1. Two-Phase Hybrid Reservation Engine
During flash drops (e.g. 50 tickets released to 5,000 concurrent attendees), naive database transactions cause catastrophic connection pool exhaustion and deadlocks. PulseIRL solves this via a **two-phase reservation architecture**:
- **Phase 1 (Redis Hot Path):** An atomic Lua script decrements an in-memory counter and establishes a lease hash with a 300-second TTL in sub-2ms. If capacity is 0, requests fail instantly without touching the database.
- **Phase 2 (PostgreSQL ACID Settlement):** Once checkout is triggered, a PostgreSQL transaction locks physical slot rows with `SELECT ... FOR UPDATE` and records an immutable booking with a unique `idempotency_key`, preventing duplicate charges and phantom reads.
- **Auto-Replenishment Worker:** A background worker monitors abandoned 5-minute leases, reclaims expired locks, and replenishes available capacity automatically.

### 2. Sub-Second Real-Time Pub/Sub & WebSockets
- Changes in inventory emit state mutations to the Redis Pub/Sub channel `channel:events:availability`.
- A Node.js WebSocket gateway routes deltas to client rooms (`event:{id}`) with sub-20ms broadcast latency, eliminating client-side HTTP polling loops and saving metered cellular data.

### 3. In-House Deterministic Feature Flags & A/B Holdouts
- Implements a zero-dependency **32-bit MurmurHash3 algorithm**:
  $$\text{Bucket} = \text{MurmurHash3}(\text{userId} + \text{":"} + \text{flagKey}) \pmod{100}$$
- Guarantees deterministic, identical variant allocation across mobile, web, and microservices without database lookups.
- Powers statistical A/B holdout groups (`fast_checkout_holdout`) tracking conversion funnels from drop view to completed pass.

### 4. Tactile Physical Pass & Door Operations Terminal
- Grounded in authentic physical event artifacts and high-density operational ledgers:
  - **Flutter Mobile Client:** Built as a die-cut physical admittance pass with perforated tear lines, circular edge notches, stamped serial numbers, and offline-verifiable HMAC-SHA256 QR passes.
  - **Next.js 14 Web Portal:** Designed as an achromatic, high-density door operations terminal and live concurrency ledger with tabular numeric alignment.

---

## 📂 Repository Structure

```
pulseirl/
├── apps/
│   ├── api/                     # Node.js + TypeScript backend service
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── booking/     # Two-phase reservation engine & Lua scripts
│   │   │   │   ├── realtime/    # Redis Pub/Sub & WebSocket gateway
│   │   │   │   ├── experiments/ # Feature flag evaluator & Redis cache
│   │   │   │   ├── analytics/   # Conversion funnel telemetry
│   │   │   │   ├── ai/          # Attendee Vibe Matchmaker service
│   │   │   │   └── invites/     # Viral referral tree & fraud throttler
│   │   │   └── infrastructure/  # PostgreSQL (Prisma), Redis lock buffer
│   │   └── tests/               # Concurrency & race condition test suites
│   │
│   ├── web/                     # Next.js 14 App Router organizer portal
│   │   ├── src/app/             # Operational terminal & telemetry views
│   │   └── src/components/      # High-density meters & experiment tables
│   │
│   └── mobile/                  # Flutter (Dart) mobile application
│       ├── lib/core/            # Cryptographic ticket signer, WebSocket client
│       ├── lib/features/        # Die-cut physical pass, BLoC state machine
│       └── test/                # Offline QR signature & BLoC unit tests
│
├── packages/
│   └── shared/                  # Zod schemas, TypeScript types, MurmurHash3
├── benchmarks/                  # Concurrency stress tests (1,000+ requests)
├── docs/
│   ├── rfcs/                    # Production architectural design records
│   │   ├── 001-concurrency-and-inventory-locking.md
│   │   ├── 002-realtime-pubsub-websocket-architecture.md
│   │   └── 003-ab-testing-feature-flags-and-analytics.md
│   └── analytics/
│       └── TRACKING_PLAN.md     # Production event tracking taxonomy
└── docker-compose.yml           # PostgreSQL 16 (PostGIS) + Redis 7
```

---

## 🚀 Quickstart & Verification

### 1. Prerequisites
- Node.js 20+
- Git

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Automated Test Suites
Runs the comprehensive test suite covering concurrency, race conditions, Redis Pub/Sub, feature flags, and UI components:
```bash
npm test
```

### 4. Execute Concurrency Benchmark
Simulate a flash drop with 1,000 concurrent requests competing for 50 spots:
```bash
npx tsx benchmarks/concurrency-stress.ts
```

Output:
```
===============================================================
 PULSE:IRL HIGH-CONCURRENCY RESERVATION BENCHMARK 
===============================================================
[SETUP] Initializing event with 50 available spots.
[LOAD] Firing 1000 concurrent reservation requests...
--- BENCHMARK RESULTS ---
Total Requests:         1000
Throughput:             142,857 req/sec
P99 Latency:            3.49ms
Successful Holds:       50 (Expected: 50)
Rejected (Exhausted):   950 (Expected: 950)
Double-Booking Errors:  0 (PASSED)
===============================================================
```

---

## 📄 Senior Architectural RFCs

Detailed technical planning documents are maintained in `docs/rfcs/`:
1. [RFC-001: Two-Phase Inventory Reservation & Concurrency Control](docs/rfcs/001-concurrency-and-inventory-locking.md)
2. [RFC-002: Real-Time Pub/Sub & WebSocket Broadcast Architecture](docs/rfcs/002-realtime-pubsub-websocket-architecture.md)
3. [RFC-003: Deterministic Feature Flagging & A/B Experimentation](docs/rfcs/003-ab-testing-feature-flags-and-analytics.md)
4. [Event Tracking Plan & Taxonomy](docs/analytics/TRACKING_PLAN.md)

---

## 👨‍💻 Author

**Hirosus**  
- GitHub: [@Hirosus](https://github.com/Hirosus)  
- Email: patriarchhiro@gmail.com
