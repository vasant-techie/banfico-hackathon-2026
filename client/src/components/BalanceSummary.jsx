import { Wallet2 } from 'lucide-react';
import { formatCurrency } from '../lib/format.js';

export function BalanceSummary({ total, currency, accountCount }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-brand-600/20 to-slate-900/50 p-6">
      <div className="flex items-center gap-2 text-slate-400">
        <Wallet2 className="h-4 w-4" />
        <span className="text-sm">Total balance across {accountCount} account{accountCount === 1 ? '' : 's'}</span>
      </div>
      <p className="mt-3 text-3xl font-bold">{formatCurrency(total, currency)}</p>
    </div>
  );
}
