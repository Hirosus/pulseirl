import { describe, it, expect, beforeEach } from 'vitest';
import { TelemetryService } from '../src/modules/analytics/telemetry.service';
import { FeatureFlagService } from '../src/modules/experiments/flags.service';

describe('A/B Test Telemetry & Conversion Funnel Analytics', () => {
  let telemetry: TelemetryService;
  let flags: FeatureFlagService;

  beforeEach(() => {
    telemetry = new TelemetryService();
    flags = new FeatureFlagService();
  });

  it('calculates conversion funnels and relative lift between Variant A and Variant B', () => {
    const experimentKey = 'fast_checkout_holdout';

    // Simulate 100 users in Variant A (Instant Hold)
    for (let i = 0; i < 100; i++) {
      telemetry.track({
        eventName: 'drop_viewed',
        userId: `user_a_${i}`,
        eventId: 'ev_vinyl',
        variant: 'A',
        experimentKey,
        timestamp: Date.now()
      });
      // 70 acquire hold
      if (i < 70) {
        telemetry.track({
          eventName: 'hold_acquired',
          userId: `user_a_${i}`,
          eventId: 'ev_vinyl',
          variant: 'A',
          experimentKey,
          timestamp: Date.now()
        });
      }
      // 60 complete checkout
      if (i < 60) {
        telemetry.track({
          eventName: 'checkout_completed',
          userId: `user_a_${i}`,
          eventId: 'ev_vinyl',
          variant: 'A',
          experimentKey,
          timestamp: Date.now()
        });
      }
    }

    // Simulate 100 users in Variant B (Control Form)
    for (let i = 0; i < 100; i++) {
      telemetry.track({
        eventName: 'drop_viewed',
        userId: `user_b_${i}`,
        eventId: 'ev_vinyl',
        variant: 'B',
        experimentKey,
        timestamp: Date.now()
      });
      // 50 acquire hold
      if (i < 50) {
        telemetry.track({
          eventName: 'hold_acquired',
          userId: `user_b_${i}`,
          eventId: 'ev_vinyl',
          variant: 'B',
          experimentKey,
          timestamp: Date.now()
        });
      }
      // 40 complete checkout
      if (i < 40) {
        telemetry.track({
          eventName: 'checkout_completed',
          userId: `user_b_${i}`,
          eventId: 'ev_vinyl',
          variant: 'B',
          experimentKey,
          timestamp: Date.now()
        });
      }
    }

    const report = telemetry.getFunnelReport(experimentKey);

    expect(report.variantA.overallConversionRate).toBe(60.0);
    expect(report.variantB.overallConversionRate).toBe(40.0);
    // Lift: (60 - 40) / 40 = +50.0%
    expect(report.conversionLiftPercentage).toBe(50.0);
  });

  it('evaluates flags with dynamic rollout adjustments', () => {
    const key = 'test_flag';
    flags.registerFlag({
      key,
      rolloutPercentage: 0,
      enabled: true
    });

    // 0% rollout -> all variant B
    expect(flags.evaluate(key, 'user_1').variant).toBe('B');

    // Update to 100% rollout -> all variant A
    flags.updateRollout(key, 100);
    expect(flags.evaluate(key, 'user_1').variant).toBe('A');
  });
});
