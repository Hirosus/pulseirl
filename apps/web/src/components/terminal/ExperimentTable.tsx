import React from 'react';

export interface ExperimentRow {
  variantName: string;
  users: number;
  reserved: number;
  completed: number;
  conversionRate: number;
  isTreatment: boolean;
}

export interface ExperimentTableProps {
  flagKey: string;
  rolloutPercentage: number;
  enabled: boolean;
  rows: ExperimentRow[];
  onToggleEnabled?: () => void;
}

export function ExperimentTable({
  flagKey,
  rolloutPercentage,
  enabled,
  rows,
  onToggleEnabled
}: ExperimentTableProps) {
  return (
    <div data-ui className="border-2 border-[#121212] p-4 bg-[#f5f4f0] space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-sm text-[#121212]">
            Experiment: {flagKey}
          </div>
          <div className="text-xs text-[#525252]">
            MurmurHash3 deterministic bucketing across registered user IDs.
          </div>
        </div>

        <button
          onClick={onToggleEnabled}
          className={`px-3 py-1.5 font-bold text-xs uppercase border-2 border-[#121212] transition-colors ${
            enabled
              ? 'bg-[#121212] text-[#ffffff] hover:bg-[#262626]'
              : 'bg-[#d4d4d4] text-[#121212] hover:bg-[#e5e5e5]'
          }`}
        >
          {enabled ? `Enabled (${rolloutPercentage}% Rollout)` : 'Disabled (0% Rollout)'}
        </button>
      </div>

      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b-2 border-[#121212] text-left">
            <th className="py-1.5">Variant</th>
            <th className="py-1.5">Users</th>
            <th className="py-1.5">Reserved</th>
            <th className="py-1.5">Completed</th>
            <th className="py-1.5 text-right">Conversion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d4d4d4] tabular">
          {rows.map((row, idx) => (
            <tr key={idx} className={row.isTreatment ? 'font-bold' : 'text-[#737373]'}>
              <td className="py-2">{row.variantName}</td>
              <td className="py-2">{row.users.toLocaleString()}</td>
              <td className="py-2">{row.reserved.toLocaleString()}</td>
              <td className="py-2">{row.completed.toLocaleString()}</td>
              <td className={`py-2 text-right ${row.isTreatment ? 'font-extrabold text-[#16a34a]' : ''}`}>
                {row.conversionRate.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
