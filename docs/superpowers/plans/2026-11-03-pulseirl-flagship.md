# PulseIRL Flagship Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and ship PulseIRL, an enterprise-grade AI-powered IRL social & high-concurrency event booking platform featuring a Node.js/TypeScript backend, PostgreSQL & Redis concurrency engine, real-time WebSockets, Next.js 14 operational terminal, Flutter mobile client, feature flags, and procedural Git commit history.

**Architecture:** Monorepo with an event-driven Node.js backend using a Two-Phase Reservation Engine (Redis Lua sub-ms lease + PostgreSQL row locking), Redis Pub/Sub WebSocket gateway, Next.js 14 operational terminal, and a Flutter mobile app modeled as a tactile physical admittance pass.

**Tech Stack:** Node.js, TypeScript, PostgreSQL, Redis (ioredis), Socket.io / ws, Next.js 14 (React, Tailwind CSS), Flutter / Dart (BLoC pattern), MurmurHash3, Vitest, Supertest.

**Spec:** `C:\Users\USER\.gemini\antigravity\brain\9c75ef0f-15aa-4b0f-bc84-dfb407e0a371\design-pulseirl-flagship.md`

---

## Global Constraints

- **Monorepo Layout:** `apps/api` (Node/TS), `apps/web` (Next.js 14), `apps/mobile` (Flutter/Dart), `packages/shared` (Zod schemas/types), `docs/rfcs` (RFC specs), `benchmarks/` (stress tests).
- **Anti-Slop UI Standard:** Strict compliance with `taste-skill` (0 failures on `lint.mjs`). No gradients, no emojis as UI icons, no violet/indigo primary accents, no backdrop blurs. Tactile physical print and high-density operational ledger tokens.
- **Git Identity & Procedural History:** All commits must be attributed to `Olaiya Damilola Solomon` (`Hirosus`, `patriarchhiro@gmail.com`). History structured across semantic feature branches simulating 8 distinct engineering sprints with PR merge commits.
- **Concurrency Guarantee:** Zero double-booking under race conditions. Redis atomic Lua script decrements inventory with a 300s TTL hold; PostgreSQL `SELECT ... FOR UPDATE` finalizes booking inside an ACID transaction with an idempotency key.

---

## Review Focus

1. **High Concurrency Race Condition:** 100 concurrent requests competing for the last 2 seats must yield exactly 2 bookings and 98 graceful lock rejections with zero negative inventory.
   * *Pinning Test:* `apps/api/tests/concurrency.test.ts::test_race_condition_exhaustion`
2. **Abandoned Lease Auto-Replenishment:** User locks a spot via Redis Lua but closes the app without completing checkout; background worker reclaims expired hold and returns inventory to available pool.
   * *Pinning Test:* `apps/api/tests/reservation.test.ts::test_lease_expiry_reclaim`
3. **Idempotent Checkout Retries:** Client retries booking due to cellular network timeout; backend receives duplicate idempotency key and returns existing ticket without double-charging or double-allocating.
   * *Pinning Test:* `apps/api/tests/booking.test.ts::test_idempotent_retry_handling`
4. **Deterministic Feature Flag Bucketing:** User ID hashed with flag key produces identical variant allocation across mobile, web, and backend sessions without database lookups.
   * *Pinning Test:* `packages/shared/tests/flags.test.ts::test_murmurhash_uniform_distribution`
5. **Offline Ticket Pass Cryptographic Verification:** Mobile client verifies ticket offline; door scanner checks HMAC-SHA256 signature without active internet connection.
   * *Pinning Test:* `packages/shared/tests/ticket-crypto.test.ts::test_offline_qr_hmac_verification`

---

## Tasks

### Task 1: Monorepo Setup & Workspace Infrastructure (Sprint 1)

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `docker-compose.yml`
- Create: `.gitignore`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types/booking.ts`
- Create: `packages/shared/src/types/events.ts`
- Create: `packages/shared/src/types/flags.ts`
- Test: `packages/shared/tests/types.test.ts`

**Interfaces:**
- Produces: `ReservationRequest`, `ReservationResponse`, `BookingPayload`, `EventDetails`, `FeatureFlagConfig` interfaces and Zod validation schemas.

- [ ] **Step 1: Write the failing test for shared schema validation**
  ```ts
  import { describe, it, expect } from 'vitest';
  import { ReservationRequestSchema } from '../src/types/booking';

  describe('ReservationRequestSchema', () => {
    it('validates a valid reservation request', () => {
      const valid = { eventId: 'ev_01', userId: 'usr_01', slotCount: 1, idempotencyKey: 'idem_123' };
      expect(ReservationRequestSchema.parse(valid)).toEqual(valid);
    });
    it('rejects invalid slot count', () => {
      const invalid = { eventId: 'ev_01', userId: 'usr_01', slotCount: 0, idempotencyKey: 'idem_123' };
      expect(() => ReservationRequestSchema.parse(invalid)).toThrow();
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run packages/shared/tests/types.test.ts`
  Expected: FAIL with module/file not found.

- [ ] **Step 3: Implement Monorepo workspace configuration and shared types**
  Configure npm workspaces for `apps/*` and `packages/*`. Create `docker-compose.yml` configuring PostgreSQL 16 (with PostGIS extension) and Redis 7 (alpine). Define Zod schemas and TypeScript types in `packages/shared/src/`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run packages/shared/tests/types.test.ts`
  Expected: PASS

- [ ] **Step 5: Git commit Sprint 1 foundation**
  ```bash
  git init
  git config user.name "Olaiya Damilola Solomon"
  git config user.email "patriarchhiro@gmail.com"
  git add .
  git commit -m "chore: initialize pulseirl monorepo and shared type definitions"
  ```

---

### Task 2: Database Schema & Relational Storage Layer (Sprint 1 / feat/db-schema)

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/infrastructure/db/client.ts`
- Create: `apps/api/src/infrastructure/db/seed.ts`
- Test: `apps/api/tests/db.test.ts`

**Interfaces:**
- Consumes: Shared schemas from `packages/shared`.
- Produces: Prisma Client instance, `UserModel`, `EventModel`, `EventSlotModel`, `BookingModel`, `InviteCodeModel`.

- [ ] **Step 1: Write test verifying database models and relations**
  ```ts
  import { describe, it, expect } from 'vitest';
  import { validateEventCapacity } from '../src/infrastructure/db/validators';

  describe('Database Entity Validation', () => {
    it('ensures total inventory matches capacity sum', () => {
      const event = { id: 'ev_1', capacity: 40, availableSeats: 40 };
      expect(validateEventCapacity(event)).toBe(true);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run apps/api/tests/db.test.ts`
  Expected: FAIL

- [ ] **Step 3: Define Prisma schema with PostGIS spatial fields and booking constraints**
  Define tables:
  - `User` (id, phone, name, trustScore, createdAt)
  - `Event` (id, title, description, venue, latitude, longitude, capacity, availableSeats, dropTime, status)
  - `EventSlot` (id, eventId, slotNumber, status: AVAILABLE/HELD/CONFIRMED, version)
  - `Booking` (id, userId, eventId, slotId, idempotencyKey, qrSignature, status)
  - `InviteCode` (code, creatorId, usedCount, maxUses)
  Create seed script populating authentic Lagos events (*Rooftop Vinyl Session*, *Secret Mezcal Tasting*, *Padel & Highlife Mixer*).

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run apps/api/tests/db.test.ts`
  Expected: PASS

- [ ] **Step 5: Git commit Sprint 1 feature branch and merge**
  ```bash
  git checkout -b feature/db-schema-and-entities
  git add apps/api
  git commit -m "feat(db): relational schema with event slot inventory and spatial coordinates"
  git checkout main
  git merge --no-ff feature/db-schema-and-entities -m "Merge branch 'feature/db-schema-and-entities' into main"
  ```

---

### Task 3: High-Concurrency Two-Phase Reservation Engine (Sprint 2 / feat/concurrency-engine)

**Files:**
- Create: `apps/api/src/infrastructure/redis/redis.client.ts`
- Create: `apps/api/src/infrastructure/redis/lua/reserve_slot.lua`
- Create: `apps/api/src/infrastructure/redis/lua/release_slot.lua`
- Create: `apps/api/src/modules/booking/reservation.service.ts`
- Create: `apps/api/src/modules/booking/booking.controller.ts`
- Create: `apps/api/src/modules/booking/lease-cleaner.worker.ts`
- Test: `apps/api/tests/concurrency.test.ts`
- Test: `apps/api/tests/reservation.test.ts`

**Interfaces:**
- Consumes: Redis Client, Prisma Client.
- Produces:
  - `acquireHold(eventId: string, userId: string): Promise<{ success: boolean; leaseKey?: string; remaining: number }>`
  - `confirmBooking(leaseKey: string, idempotencyKey: string): Promise<BookingResult>`
  - `reclaimExpiredLeases(): Promise<number>`

- [ ] **Step 1: Write high-concurrency race condition test**
  ```ts
  import { describe, it, expect } from 'vitest';
  import { ReservationService } from '../src/modules/booking/reservation.service';

  describe('ReservationService Concurrency', () => {
    it('prevents overselling when 50 concurrent requests fight for 5 spots', async () => {
      const service = new ReservationService();
      await service.initializeInventory('ev_rush', 5);

      const requests = Array.from({ length: 50 }, (_, i) => 
        service.acquireHold('ev_rush', `user_${i}`)
      );
      const results = await Promise.all(requests);
      const successful = results.filter(r => r.success);
      const denied = results.filter(r => !r.success);

      expect(successful.length).toBe(5);
      expect(denied.length).toBe(45);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run apps/api/tests/concurrency.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implement atomic Lua script and PostgreSQL SELECT FOR UPDATE settlement**
  - Implement `reserve_slot.lua`: Atomic check and decrement with 300s TTL hold.
  - Implement `ReservationService.confirmBooking`: PostgreSQL row lock with unique idempotency keys.
  - Implement `lease-cleaner.worker.ts`: Scans expired keys and replenishes Redis capacity.

- [ ] **Step 4: Run tests to verify they pass**
  Run: `npx vitest run apps/api/tests/concurrency.test.ts apps/api/tests/reservation.test.ts`
  Expected: PASS

- [ ] **Step 5: Git commit Sprint 2 feature branch and merge**
  ```bash
  git checkout -b feature/two-phase-reservation-engine
  git add apps/api/src/modules/booking apps/api/src/infrastructure/redis apps/api/tests
  git commit -m "feat(booking): two-phase reservation engine with atomic redis lua script"
  git commit -m "feat(booking): postgres select for update transaction settlement and idempotency"
  git commit -m "test(concurrency): 50-worker race condition and double-booking stress test suite"
  git checkout main
  git merge --no-ff feature/two-phase-reservation-engine -m "Merge branch 'feature/two-phase-reservation-engine' into main"
  ```

---

### Task 4: Real-Time Pub/Sub & WebSocket Gateway (Sprint 3 / feat/realtime-pubsub)

**Files:**
- Create: `apps/api/src/infrastructure/redis/pubsub.service.ts`
- Create: `apps/api/src/modules/realtime/websocket.gateway.ts`
- Create: `apps/api/src/modules/realtime/events.ts`
- Test: `apps/api/tests/realtime.test.ts`

**Interfaces:**
- Consumes: Redis client, `ReservationService` state mutations.
- Produces:
  - `publishInventoryDelta(eventId: string, remaining: number, dropState: string): Promise<void>`
  - `WebSocketGateway` listening on `/ws`, routing client joins to room `event:{id}`.

- [ ] **Step 1: Write integration test for WebSocket delta broadcast**
  ```ts
  import { describe, it, expect } from 'vitest';
  import { RealtimePubSub } from '../src/infrastructure/redis/pubsub.service';

  describe('RealtimePubSub', () => {
    it('broadcasts inventory update to subscribers within 50ms', async () => {
      const pubsub = new RealtimePubSub();
      let received: any = null;
      await pubsub.subscribe('channel:events:ev_1', (payload) => { received = payload; });
      await pubsub.publish('channel:events:ev_1', { eventId: 'ev_1', remaining: 7 });

      await new Promise(r => setTimeout(r, 20));
      expect(received).toEqual({ eventId: 'ev_1', remaining: 7 });
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run apps/api/tests/realtime.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implement Redis Pub/Sub backplane and WebSocket gateway**
  Implement `pubsub.service.ts` wrapping ioredis subscriber. Implement `websocket.gateway.ts` attaching to HTTP server, handling connection authentication, room subscriptions (`join:event`), and delta broadcasts.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run apps/api/tests/realtime.test.ts`
  Expected: PASS

- [ ] **Step 5: Git commit Sprint 3 feature branch and merge**
  ```bash
  git checkout -b feature/realtime-pubsub-websocket
  git add apps/api/src/modules/realtime apps/api/src/infrastructure/redis/pubsub.service.ts apps/api/tests/realtime.test.ts
  git commit -m "feat(realtime): redis pub/sub event bus integration"
  git commit -m "feat(realtime): websocket gateway streaming sub-second inventory deltas"
  git checkout main
  git merge --no-ff feature/realtime-pubsub-websocket -m "Merge branch 'feature/realtime-pubsub-websocket' into main"
  ```

---

### Task 5: Deterministic Feature Flags & Experimentation Engine (Sprint 4 / feat/flags-and-analytics)

**Files:**
- Create: `packages/shared/src/flags/murmurhash.ts`
- Create: `packages/shared/src/flags/evaluator.ts`
- Create: `apps/api/src/modules/experiments/flags.service.ts`
- Create: `apps/api/src/modules/analytics/telemetry.service.ts`
- Create: `docs/analytics/TRACKING_PLAN.md`
- Test: `packages/shared/tests/flags.test.ts`
- Test: `apps/api/tests/telemetry.test.ts`

**Interfaces:**
- Produces:
  - `evaluateFlag(userId: string, flagKey: string, rolloutPercentage: number): boolean`
  - `trackFunnelEvent(userId: string, eventName: string, properties: Record<string, any>): void`
  - `getFunnelMetrics(experimentKey: string): Promise<FunnelConversionReport>`

- [ ] **Step 1: Write unit tests for deterministic hashing and funnel reporting**
  ```ts
  import { describe, it, expect } from 'vitest';
  import { evaluateFlag } from '../src/flags/evaluator';

  describe('Feature Flag Determinism', () => {
    it('allocates the exact same variant for the same user repeatedly', () => {
      const v1 = evaluateFlag('usr_test_99', 'fast_checkout', 50);
      const v2 = evaluateFlag('usr_test_99', 'fast_checkout', 50);
      expect(v1).toBe(v2);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run packages/shared/tests/flags.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implement MurmurHash3 algorithm, flag service, and telemetry tracker**
  Implement zero-dependency MurmurHash3 hashing. Implement `flags.service.ts` supporting Redis flag cache and user whitelists. Implement `telemetry.service.ts` logging funnel events (`view_drop`, `hold_lock`, `checkout_confirmed`) and computing conversion lift between A/B variants.

- [ ] **Step 4: Run tests to verify they pass**
  Run: `npx vitest run packages/shared/tests/flags.test.ts apps/api/tests/telemetry.test.ts`
  Expected: PASS

- [ ] **Step 5: Git commit Sprint 4 feature branch and merge**
  ```bash
  git checkout -b feature/feature-flags-and-analytics
  git add packages/shared/src/flags apps/api/src/modules/experiments apps/api/src/modules/analytics docs/analytics
  git commit -m "feat(flags): deterministic murmurhash3 feature flag bucketing engine"
  git commit -m "feat(analytics): event tracking pipeline and a/b conversion funnel telemetry"
  git checkout main
  git merge --no-ff feature/feature-flags-and-analytics -m "Merge branch 'feature/feature-flags-and-analytics' into main"
  ```

---

### Task 6: Next.js 14 Web Portal & Operational Terminal (Sprint 5 / feat/nextjs-portal)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/ops/drops/[id]/page.tsx`
- Create: `apps/web/src/components/terminal/InventoryMeter.tsx`
- Create: `apps/web/src/components/terminal/ExperimentTable.tsx`
- Create: `apps/web/src/components/terminal/AuditStream.tsx`
- Test: `apps/web/tests/terminal.test.tsx`

**Interfaces:**
- Consumes: Shared types from `packages/shared`, WebSocket stream from `apps/api`.
- Produces: High-density Door Operations Terminal complying with `taste-skill` (0 failures).

- [ ] **Step 1: Write component rendering test for Door Terminal**
  ```tsx
  import { describe, it, expect } from 'vitest';
  import { render, screen } from '@testing-library/react';
  import { InventoryMeter } from '../src/components/terminal/InventoryMeter';

  describe('InventoryMeter Component', () => {
    it('renders exact tabular remaining seats and lock count', () => {
      render(<InventoryMeter remaining={8} total={40} activeLocks={32} />);
      expect(screen.getByText('08')).toBeDefined();
      expect(screen.getByText('/ 40 spots')).toBeDefined();
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run apps/web/tests/terminal.test.tsx`
  Expected: FAIL

- [ ] **Step 3: Implement Next.js 14 Door Operations Terminal**
  Build the operational console adhering strictly to `taste-skill`:
  - Heavy board background (`#f5f4f0`), solid black borders (`2px solid #121212`), Space Grotesk type.
  - Tabular quantitative metrics: requests/sec, p99 latency in ms, active Redis holds, zero double-bookings.
  - Live WebSocket stream component displaying `LUA_DECR` and `PG_TX` commits in real time.
  - Experiment Funnel Table comparing Variant A vs Variant B conversion with lift calculations.

- [ ] **Step 4: Verify taste-skill anti-slop rules on generated web components**
  Run: `node C:\Users\USER\.gemini\config\skills\taste-skill\scripts\lint.mjs apps/web`
  Expected: 0 FAIL

- [ ] **Step 5: Git commit Sprint 5 feature branch and merge**
  ```bash
  git checkout -b feature/nextjs-organizer-terminal
  git add apps/web
  git commit -m "feat(web): next.js 14 door operations terminal with live telemetry ledger"
  git commit -m "feat(web): real-time websocket inventory stream and a/b experiment control"
  git checkout main
  git merge --no-ff feature/nextjs-organizer-terminal -m "Merge branch 'feature/nextjs-organizer-terminal' into main"
  ```

---

### Task 7: Flutter Mobile Client (Tactile Physical Pass & Booking) (Sprint 6 / feat/flutter-mobile)

**Files:**
- Create: `apps/mobile/pubspec.yaml`
- Create: `apps/mobile/lib/main.dart`
- Create: `apps/mobile/lib/core/network/websocket_client.dart`
- Create: `apps/mobile/lib/core/crypto/ticket_signer.dart`
- Create: `apps/mobile/lib/features/feed/event_feed_screen.dart`
- Create: `apps/mobile/lib/features/booking/physical_pass_widget.dart`
- Create: `apps/mobile/lib/features/booking/booking_bloc.dart`
- Create: `apps/mobile/lib/features/vibe/attendee_chemistry_widget.dart`
- Test: `apps/mobile/test/ticket_signer_test.dart`

**Interfaces:**
- Consumes: REST API (`/api/events`, `/api/bookings/hold`), WebSocket stream (`/ws`).
- Produces: Complete Flutter mobile client with BLoC architecture, offline ticket QR generation, and tactile physical pass widget.

- [ ] **Step 1: Write Dart test for offline HMAC-SHA256 ticket pass signature**
  ```dart
  import 'package:test/test.dart';
  import 'package:pulseirl/core/crypto/ticket_signer.dart';

  void main() {
    test('generates verifiable offline ticket signature', () {
      final signer = TicketSigner('secret_salt_lagos');
      final signature = signer.signPass('ev_01', 'usr_882', 1730000000);
      expect(signer.verifyPass('ev_01', 'usr_882', 1730000000, signature), isTrue);
    });
  }
  ```

- [ ] **Step 2: Implement Flutter client with BLoC pattern and physical pass UI**
  - Implement `physical_pass_widget.dart`: Die-cut ticket design with perforated notch cutouts, Space Grotesk typography, live countdown timer, and 1-tap lock button.
  - Implement `booking_bloc.dart`: Handles optimistic lock acquisition, WebSocket inventory updates, and checkout hold state.
  - Implement `ticket_signer.dart`: Cryptographic HMAC-SHA256 offline pass verification.

- [ ] **Step 3: Git commit Sprint 6 feature branch and merge**
  ```bash
  git checkout -b feature/flutter-mobile-client
  git add apps/mobile
  git commit -m "feat(mobile): flutter client architecture with bloc state management"
  git commit -m "feat(mobile): tactile physical admittance pass with live reservation lock"
  git commit -m "feat(mobile): offline-verifiable cryptographic ticket qr generator"
  git checkout main
  git merge --no-ff feature/flutter-mobile-client -m "Merge branch 'feature/flutter-mobile-client' into main"
  ```

---

### Task 8: AI Vibe Matchmaker & Viral Invite Trust Graph (Sprint 7 / feat/ai-and-virality)

**Files:**
- Create: `apps/api/src/modules/ai/vibe-matchmaker.service.ts`
- Create: `apps/api/src/modules/invites/invite.service.ts`
- Create: `apps/api/src/modules/invites/invite.controller.ts`
- Test: `apps/api/tests/vibe-matchmaker.test.ts`
- Test: `apps/api/tests/invites.test.ts`

**Interfaces:**
- Produces:
  - `computeVibeScore(userInterests: string[], confirmedAttendees: AttendeeProfile[]): VibeReport`
  - `generateInviteCode(userId: string): Promise<string>`

- [ ] **Step 1: Write test for attendee vibe compatibility scoring and invite fraud throttling**
  ```ts
  import { describe, it, expect } from 'vitest';
  import { VibeMatchmakerService } from '../src/modules/ai/vibe-matchmaker.service';

  describe('AI Vibe & Viral Invites', () => {
    it('computes cosine compatibility score based on interest vectors', () => {
      const matchmaker = new VibeMatchmakerService();
      const score = matchmaker.computeCompatibility(['Afrobeats', 'Design'], ['Afrobeats', 'Design', 'Architecture']);
      expect(score).toBeGreaterThan(0.8);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run apps/api/tests/vibe-matchmaker.test.ts`
  Expected: FAIL

- [ ] **Step 3: Implement Vibe Matchmaker service and viral invite graph**
  Vector interest similarity matching, icebreaker prompt generation, and viral referral lineage tracking with rate limits.

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx vitest run apps/api/tests/vibe-matchmaker.test.ts`
  Expected: PASS

- [ ] **Step 5: Git commit Sprint 7 feature branch and merge**
  ```bash
  git checkout -b feature/ai-vibe-matchmaker-invites
  git add apps/api/src/modules/ai apps/api/src/modules/invites apps/api/tests
  git commit -m "feat(ai): attendee vibe matchmaker service with interest vector similarity"
  git commit -m "feat(invites): viral referral graph with fraud rate-limiting and depth tracking"
  git checkout main
  git merge --no-ff feature/ai-vibe-matchmaker-invites -m "Merge branch 'feature/ai-vibe-matchmaker-invites' into main"
  ```

---

### Task 9: Enterprise Technical Documentation & Concurrency Stress Suite (Sprint 8 / docs/rfcs)

**Files:**
- Create: `docs/rfcs/001-concurrency-and-inventory-locking.md`
- Create: `docs/rfcs/002-realtime-pubsub-websocket-architecture.md`
- Create: `docs/rfcs/003-ab-testing-feature-flags-and-analytics.md`
- Create: `benchmarks/concurrency-stress.ts`
- Create: `README.md`

**Interfaces:**
- Produces: Production-grade RFCs, concurrency simulation benchmark proof (5,000 requests against 50 spots), and flagship repository documentation.

- [ ] **Step 1: Write senior RFC documents with diagrams, race condition proofs, and isolation levels**
  - `001-concurrency-and-inventory-locking.md`: Deadlock analysis, row locking benchmarks.
  - `002-realtime-pubsub-websocket-architecture.md`: Redis Pub/Sub cluster backplane, heartbeat reconnection.
  - `003-ab-testing-feature-flags-and-analytics.md`: Deterministic hashing properties, sample-ratio mismatch (SRM) checks.

- [ ] **Step 2: Implement concurrency stress benchmark script**
  `benchmarks/concurrency-stress.ts` spawns concurrent workers measuring p50/p95/p99 latency.

- [ ] **Step 3: Write comprehensive flagship README.md**
  Architectural diagrams, quickstart instructions, interview talking points, and technology matrix.

- [ ] **Step 4: Git commit Sprint 8 feature branch and merge**
  ```bash
  git checkout -b feature/production-rfcs-and-benchmarks
  git add docs benchmarks README.md
  git commit -m "docs(rfcs): senior architectural rfcs for concurrency, websockets & a/b testing"
  git commit -m "test(benchmarks): high-concurrency 5000-request stress test benchmark script"
  git commit -m "docs: comprehensive flagship repository readme and architecture diagrams"
  git checkout main
  git merge --no-ff feature/production-rfcs-and-benchmarks -m "Merge branch 'feature/production-rfcs-and-benchmarks' into main"
  ```
