import { describe, it, expect } from 'vitest';
import { murmurhash3, getBucket } from '../src/flags/murmurhash';
import { evaluateFlag } from '../src/flags/evaluator';
import { FeatureFlagConfig } from '../src/types/flags';

describe('Deterministic Feature Flags & MurmurHash3 Uniformity', () => {
  it('deterministically hashes identical keys to the same integer', () => {
    const h1 = murmurhash3('user_lagos_99:fast_checkout');
    const h2 = murmurhash3('user_lagos_99:fast_checkout');
    expect(h1).toBe(h2);
    expect(typeof h1).toBe('number');
  });

  it('maintains a uniform distribution across buckets 0 to 99 over 5,000 samples', () => {
    const buckets = new Array(100).fill(0);
    const sampleSize = 5000;

    for (let i = 0; i < sampleSize; i++) {
      const b = getBucket(`simulated_user_${i}`, 'test_flag_key');
      buckets[b]++;
    }

    const expectedMean = sampleSize / 100; // 50
    for (let b = 0; b < 100; b++) {
      // Each bucket should fall within reasonable variance (e.g. 25 to 75)
      expect(buckets[b]).toBeGreaterThan(25);
      expect(buckets[b]).toBeLessThan(75);
    }
  });

  it('respects percentage rollouts accurately', () => {
    const flag50: FeatureFlagConfig = {
      key: 'fast_checkout',
      rolloutPercentage: 50,
      enabled: true
    };

    let variantACount = 0;
    const testCount = 1000;
    for (let i = 0; i < testCount; i++) {
      const res = evaluateFlag(flag50, { userId: `user_${i}` });
      if (res.variant === 'A') variantACount++;
    }

    // Expect ~50% (450 to 550)
    expect(variantACount).toBeGreaterThan(450);
    expect(variantACount).toBeLessThan(550);
  });

  it('honors whitelist overrides regardless of percentage', () => {
    const flagZero: FeatureFlagConfig = {
      key: 'vip_beta_drop',
      rolloutPercentage: 0,
      enabled: true,
      whitelistUsers: ['usr_vip_founder', 'usr_lead_engineer']
    };

    const regularUser = evaluateFlag(flagZero, { userId: 'usr_random_99' });
    expect(regularUser.enabled).toBe(false);
    expect(regularUser.variant).toBe('B');

    const whitelisted = evaluateFlag(flagZero, { userId: 'usr_vip_founder' });
    expect(whitelisted.enabled).toBe(true);
    expect(whitelisted.variant).toBe('A');
    expect(whitelisted.reason).toBe('WHITELIST');
  });
});
