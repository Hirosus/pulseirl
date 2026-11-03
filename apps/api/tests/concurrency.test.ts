import { describe, it, expect, beforeEach } from 'vitest';
import { ReservationService } from '../src/modules/booking/reservation.service';
import { DatabaseMemoryStore } from '../src/infrastructure/db/client';

describe('High-Concurrency Race Condition & Double-Booking Verification', () => {
  let service: ReservationService;

  beforeEach(() => {
    DatabaseMemoryStore.reset();
    service = new ReservationService();
  });

  it('guarantees zero oversell when 100 concurrent requests fight for 5 spots', async () => {
    const eventId = 'ev_flash_drop_lagos';
    const totalSpots = 5;
    await service.initializeEventInventory(eventId, totalSpots);

    // 100 simultaneous concurrent users hitting the reservation lock
    const concurrentRequests = Array.from({ length: 100 }, (_, i) =>
      service.acquireHold(eventId, `user_${i}`, 1, 300)
    );

    const results = await Promise.all(concurrentRequests);
    const successfulHolds = results.filter(r => r.success);
    const rejectedHolds = results.filter(r => !r.success);

    expect(successfulHolds.length).toBe(5);
    expect(rejectedHolds.length).toBe(95);

    const remaining = await service.getAvailableCapacity(eventId);
    expect(remaining).toBe(0);

    // Settle all 5 successful holds into PostgreSQL transactions
    for (const hold of successfulHolds) {
      const confirmRes = await service.confirmBooking(
        hold.leaseKey!,
        'user_test',
        eventId,
        `idem_${hold.leaseKey}`
      );
      expect(confirmRes.success).toBe(true);
      expect(confirmRes.bookingId).toBeDefined();
    }

    // Verify exactly 5 confirmed records in Database store
    expect(DatabaseMemoryStore.bookings.size).toBe(5);
  });

  it('prevents a single user from acquiring duplicate concurrent leases for the same drop', async () => {
    const eventId = 'ev_exclusive_supper';
    await service.initializeEventInventory(eventId, 10);

    const firstHold = await service.acquireHold(eventId, 'user_greedy', 1, 300);
    expect(firstHold.success).toBe(true);

    const secondHold = await service.acquireHold(eventId, 'user_greedy', 1, 300);
    expect(secondHold.success).toBe(false);
    expect(secondHold.error).toBe('USER_ALREADY_HOLDS_LEASE');
  });
});
