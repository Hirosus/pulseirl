'use client';

import React, { useState } from 'react';
import { InventoryMeter } from '../components/terminal/InventoryMeter';
import { ExperimentTable } from '../components/terminal/ExperimentTable';
import { AuditStream, AuditStreamItem } from '../components/terminal/AuditStream';

export default function TerminalDashboardPage() {
  const [flagEnabled, setFlagEnabled] = useState(true);
  const [remaining, setRemaining] = useState(8);
  const [activeLocks, setActiveLocks] = useState(32);

  const [auditItems, setAuditItems] = useState<AuditStreamItem[]>([
    {
      id: '1',
      time: '17:21:04',
      action: 'LUA_DECR: slot_08 reserved by user_88291a (TTL: 300s)',
      durationMs: 0.8,
      type: 'LUA'
    },
    {
      id: '2',
      time: '17:21:05',
      action: 'PG_TX: SELECT FOR UPDATE on event_inventory committed',
      durationMs: 7.2,
      type: 'PG'
    },
    {
      id: '3',
      time: '17:21:05',
      action: 'WSS_BROADCAST: channel:ev_99182:inventory (remaining: 8)',
      durationMs: 2.1,
      type: 'WS'
    }
  ]);

  const experimentRows = [
    {
      variantName: 'Variant A (1-Tap Fast Hold)',
      users: 2410,
      reserved: 1820,
      completed: 1643,
      conversionRate: 68.1,
      isTreatment: true
    },
    {
      variantName: 'Variant B (Standard Form Holdout)',
      users: 2411,
      reserved: 1450,
      completed: 1239,
      conversionRate: 51.3,
      isTreatment: false
    }
  ];

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* Header */}
      <div className="border-b-2 border-[#121212] pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-block px-2.5 py-0.5 bg-[#fde047] border border-[#121212] text-xs font-bold uppercase mb-2">
            Operations Console • Lagos VI Cluster
          </div>
          <h1 className="text-3xl font-extrabold text-[#121212]">
            PulseIRL / Venue Door Terminal
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#16a34a] border border-[#121212]"></span>
          <span className="text-xs font-bold text-[#121212]">WebSocket Gateway Connected</span>
        </div>
      </div>

      {/* Main Terminal Components */}
      <InventoryMeter
        remaining={remaining}
        total={40}
        activeLocks={activeLocks}
        p99LatencyMs={8.4}
        requestsPerSec={240.2}
      />

      <ExperimentTable
        flagKey="fast_checkout_holdout"
        rolloutPercentage={50}
        enabled={flagEnabled}
        rows={experimentRows}
        onToggleEnabled={() => setFlagEnabled(!flagEnabled)}
      />

      <AuditStream items={auditItems} />

    </main>
  );
}
