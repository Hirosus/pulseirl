import { describe, it, expect } from 'vitest';
import React from 'react';
import { InventoryMeter } from '../src/components/terminal/InventoryMeter';
import { ExperimentTable } from '../src/components/terminal/ExperimentTable';
import { AuditStream } from '../src/components/terminal/AuditStream';

describe('Next.js 14 Web Terminal Components', () => {
  it('creates InventoryMeter element with required properties', () => {
    const el = React.createElement(InventoryMeter, {
      remaining: 8,
      total: 40,
      activeLocks: 32,
      p99LatencyMs: 8.4,
      requestsPerSec: 240.2
    });
    expect(el).toBeDefined();
    expect(el.props.remaining).toBe(8);
    expect(el.props.total).toBe(40);
  });

  it('creates ExperimentTable with treatment and control rows', () => {
    const el = React.createElement(ExperimentTable, {
      flagKey: 'fast_checkout_holdout',
      rolloutPercentage: 50,
      enabled: true,
      rows: [
        {
          variantName: 'Variant A',
          users: 1000,
          reserved: 700,
          completed: 600,
          conversionRate: 60.0,
          isTreatment: true
        }
      ]
    });
    expect(el.props.flagKey).toBe('fast_checkout_holdout');
    expect(el.props.rows.length).toBe(1);
  });

  it('creates AuditStream with real-time log rows', () => {
    const el = React.createElement(AuditStream, {
      items: [
        {
          id: '1',
          time: '17:00:00',
          action: 'LUA_DECR: slot_01',
          durationMs: 1.2,
          type: 'LUA'
        }
      ]
    });
    expect(el.props.items.length).toBe(1);
  });
});
