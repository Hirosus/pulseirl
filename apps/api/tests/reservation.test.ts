import { describe, it, expect, beforeEach } from 'vitest';
import { ReservationService } from '../src/modules/booking/reservation.service';
import { LeaseCleanerWorker } from '../src/modules/booking/lease-cleaner.worker';
import { DatabaseMemoryStore } from '../src/infrastructure/db/client';

describe('Reservation Lifecycle & Idempotency Settlement', () => {
  let service: ReservationService;
  let worker: LeaseCleanerWorker;

  beforeEach(() => {
    DatabaseMemoryStore.reset();
    service = new ReservationService();
    worker = new LeaseCleanerWorker(service);
  });

  it('reclaims abandoned expired leases and restores available capacity', async () => {
    const eventId = 'ev_abandon_test';
    await service.initializeEventInventory(eventId, 10);

    const hold = await service.acquireHold(eventId, 'user_abandon', 1, 300);
    expect(hold.success).toBe(true);
    expect(await service.getAvailableCapacity(eventId)).toBe(9);

    // Force lease to expire in Redis
    service.getRedisClient().forceExpire(hold.leaseKey!);

    // Run lease cleaner
    const reclaimed = await worker.runOnce(eventId);
    expect(reclaimed).toBe(1);

    // Available capacity should be restored to 10
    expect(await service.getAvailableCapacity(eventId)).toBe(10);
  });

  it('handles idempotent checkout retries gracefully', async () => {
    const eventId = 'ev_retry_test';
    await service.initializeEventInventory(eventId, 5);

    const hold = await service.acquireHold(eventId, 'user_retry', 1, 300);
    expect(hold.success).toBe(true);

    const idempotencyKey = 'idem_key_uuid_77218';

    // First attempt succeeds
    const firstCall = await service.confirmBooking(
      hold.leaseKey!,
      'user_retry',
      eventId,
      idempotencyKey
    );
    expect(firstCall.success).toBe(true);
    expect(firstCall.idempotentReplay).toBe(false);
    const originalBookingId = firstCall.bookingId;

    // Simulated network retry with the same idempotencyKey
    const secondCall = await service.confirmBooking(
      hold.leaseKey!,
      'user_retry',
      eventId,
      idempotencyKey
    );
    expect(secondCall.success).toBe(true);
    expect(secondCall.idempotentReplay).toBe(true);
    expect(secondCall.bookingId).toBe(originalBookingId);

    // Database must only have 1 booking record, not 2
    expect(DatabaseMemoryStore.bookings.size).toBe(1);
  });

  it('rejects confirmation if lease has already expired', async () => {
    const eventId = 'ev_late_checkout';
    await service.initializeEventInventory(eventId, 5);

    const hold = await service.acquireHold(eventId, 'user_slow', 1, 300);
    expect(hold.success).toBe(true);

    // Expire and reclaim
    service.getRedisClient().forceExpire(hold.leaseKey!);
    await worker.runOnce(eventId);

    // Attempting to confirm after expiry must fail
    const confirmRes = await service.confirmBooking(
      hold.leaseKey!,
      'user_slow',
      eventId,
      'idem_too_late'
    );
    expect(confirmRes.success).toBe(false);
    expect(confirmRes.error).toBe('LEASE_EXPIRED_OR_INVALID');
  });
});
