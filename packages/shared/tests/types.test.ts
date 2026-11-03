import { describe, it, expect } from 'vitest';
import { ReservationRequestSchema, BookingStatus } from '../src/types/booking';
import { EventStatus, EventDetailsSchema } from '../src/types/events';
import { FeatureFlagConfigSchema } from '../src/types/flags';

describe('Shared Domain Types & Schema Validation', () => {
  it('validates a valid reservation request schema', () => {
    const valid = {
      eventId: 'ev_rooftop_vinyl',
      userId: 'usr_8829a',
      slotCount: 1,
      idempotencyKey: 'idem_99182a_uuid'
    };
    const parsed = ReservationRequestSchema.parse(valid);
    expect(parsed.eventId).toBe('ev_rooftop_vinyl');
    expect(parsed.slotCount).toBe(1);
  });

  it('rejects invalid reservation requests with negative or zero slots', () => {
    const invalid = {
      eventId: 'ev_01',
      userId: 'usr_01',
      slotCount: 0,
      idempotencyKey: 'idem_123'
    };
    expect(() => ReservationRequestSchema.parse(invalid)).toThrow();
  });

  it('validates an event details object with capacity constraints', () => {
    const event = {
      id: 'ev_lagos_01',
      title: 'Secret Mezcal Tasting',
      venue: '14 Akin Adesola, Victoria Island',
      latitude: 6.4281,
      longitude: 3.4219,
      capacity: 40,
      availableSeats: 8,
      status: EventStatus.LIVE_DROP
    };
    const parsed = EventDetailsSchema.parse(event);
    expect(parsed.status).toBe(EventStatus.LIVE_DROP);
    expect(parsed.capacity).toBe(40);
  });

  it('validates feature flag configuration rules', () => {
    const flag = {
      key: 'fast_checkout_holdout',
      rolloutPercentage: 50,
      description: 'A/B test 1-tap checkout versus standard multi-step booking form',
      enabled: true
    };
    const parsed = FeatureFlagConfigSchema.parse(flag);
    expect(parsed.rolloutPercentage).toBe(50);
  });
});
