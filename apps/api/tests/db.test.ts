import { describe, it, expect } from 'vitest';
import { validateEventCapacity, calculateDistanceKm } from '../src/infrastructure/db/validators';
import { SEED_EVENTS } from '../src/infrastructure/db/seed';

describe('Database Entity Validation & Seed Integrity', () => {
  it('validates event capacity invariants across seed data', () => {
    for (const ev of SEED_EVENTS) {
      expect(validateEventCapacity(ev)).toBe(true);
      expect(ev.availableSeats).toBeLessThanOrEqual(ev.capacity);
    }
  });

  it('rejects events with impossible capacity states', () => {
    expect(validateEventCapacity({ capacity: 0, availableSeats: 0 })).toBe(false);
    expect(validateEventCapacity({ capacity: 20, availableSeats: -1 })).toBe(false);
    expect(validateEventCapacity({ capacity: 20, availableSeats: 25 })).toBe(false);
  });

  it('calculates accurate Haversine spatial distances in Lagos metro', () => {
    // Victoria Island to Lekki Phase 1 is ~5.5-6.5 km
    const dist = calculateDistanceKm(6.4281, 3.4219, 6.4474, 3.4731);
    expect(dist).toBeGreaterThan(5.0);
    expect(dist).toBeLessThan(7.0);
  });
});
