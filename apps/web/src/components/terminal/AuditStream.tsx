import React from 'react';

export interface AuditStreamItem {
  id: string;
  time: string;
  action: string;
  durationMs: number;
  type: 'LUA' | 'PG' | 'WS';
}

export interface AuditStreamProps {
  items: AuditStreamItem[];
}

export function AuditStream({ items }: AuditStreamProps) {
  return (
    <div data-ui className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs uppercase text-[#121212]">
          Live Concurrency Audit Ledger
        </span>
        <span className="text-xs text-[#737373]">Redis Pub/Sub Stream</span>
      </div>

      <div className="border-2 border-[#121212] p-3 bg-[#fffdf5] text-xs space-y-1.5 max-h-48 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-xs text-[#737373] py-2 text-center">
            Awaiting drop transactions...
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-[#121212] tabular">
              <span className="truncate pr-2">
                <span className="text-[#737373]">[{item.time}]</span>{' '}
                <strong className={item.type === 'PG' ? 'text-[#16a34a]' : ''}>{item.action}</strong>
              </span>
              <span className="text-[#737373] text-[11px] whitespace-nowrap">
                {item.durationMs.toFixed(1)}ms
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
