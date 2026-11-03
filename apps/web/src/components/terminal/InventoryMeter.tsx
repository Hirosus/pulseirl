import React from 'react';

export interface InventoryMeterProps {
  remaining: number;
  total: number;
  activeLocks: number;
  p99LatencyMs?: number;
  requestsPerSec?: number;
}

export function InventoryMeter({
  remaining,
  total,
  activeLocks,
  p99LatencyMs = 8.4,
  requestsPerSec = 240.2
}: InventoryMeterProps) {
  const percentTaken = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
  const formattedRemaining = remaining.toString().padStart(2, '0');

  return (
    <div data-ui className="border-2 border-[#121212] bg-[#ffffff] p-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b-2 border-[#121212] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-2xl text-[#121212]">
              High-Demand Drop Terminal
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-[#16a34a] text-[#ffffff] border border-[#121212]">
              LIVE
            </span>
          </div>
          <p className="text-xs text-[#525252] mt-1">
            Active Event: Rooftop Vinyl Session • Drop ID: ev_99182 • Engine: 2-Phase Concurrency
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-[#737373] uppercase font-bold">P99 DB Lock Latency</div>
          <div className="text-xl font-extrabold text-[#121212] tabular">
            {p99LatencyMs}ms
          </div>
        </div>
      </div>

      {/* Quantitative Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border-2 border-[#121212] p-3 bg-[#fffdf5]">
          <div className="text-xs text-[#525252] font-bold uppercase">Requests / Sec</div>
          <div className="text-2xl font-extrabold text-[#121212] tabular mt-1">{requestsPerSec}</div>
          <div className="text-xs text-[#16a34a] mt-0.5 font-bold">Zero drops</div>
        </div>

        <div className="border-2 border-[#121212] p-3 bg-[#fffdf5]">
          <div className="text-xs text-[#525252] font-bold uppercase">Active Redis Holds</div>
          <div className="text-2xl font-extrabold text-[#121212] tabular mt-1">{activeLocks}</div>
          <div className="text-xs text-[#525252] mt-0.5">300s TTL auto-expiry</div>
        </div>

        <div className="border-2 border-[#121212] p-3 bg-[#fffdf5]">
          <div className="text-xs text-[#525252] font-bold uppercase">Double-Bookings</div>
          <div className="text-2xl font-extrabold text-[#16a34a] tabular mt-1">0</div>
          <div className="text-xs text-[#16a34a] mt-0.5 font-bold">100% Invariant Met</div>
        </div>
      </div>

      {/* Inventory Bar */}
      <div className="space-y-1.5 pt-2">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs text-[#525252]">Remaining Inventory</span>
            <div className="text-2xl font-extrabold text-[#121212] tabular">
              {formattedRemaining} <span className="text-sm font-normal text-[#737373]">/ {total} spots</span>
            </div>
          </div>
          <div className="text-xs text-[#525252] font-bold tabular">
            {percentTaken}% Locked
          </div>
        </div>
        
        <div className="w-full h-3 border-2 border-[#121212] bg-[#f5f4f0] overflow-hidden">
          <div className="h-full bg-[#121212]" style={{ width: `${percentTaken}%` }} />
        </div>
      </div>

    </div>
  );
}
