import { formatCurrency } from '../lib/format.js';

const LABEL_COLORS = {
  Healthy: 'text-emerald-400',
  Watch: 'text-amber-400',
  'At risk': 'text-rose-400',
  Unknown: 'text-slate-400',
};

export function HealthScoreCard({ totals, health, narrative }) {
  const color = LABEL_COLORS[health?.label] || LABEL_COLORS.Unknown;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <p className={`text-lg font-semibold ${color}`}>{health?.label || 'Unknown'}</p>
      {narrative && <p className="mt-2 text-sm text-slate-400">{narrative}</p>}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-slate-500">Income</p>
          <p className="mt-1 font-semibold text-emerald-400">{formatCurrency(totals?.income)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Expense</p>
          <p className="mt-1 font-semibold text-rose-400">{formatCurrency(totals?.expense)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Net</p>
          <p className="mt-1 font-semibold">{formatCurrency(totals?.net)}</p>
        </div>
      </div>
    </div>
  );
}
