import { Repeat } from 'lucide-react';
import { formatCurrency } from '../lib/format.js';

export function SubscriptionList({ subscriptions }) {
  if (!subscriptions?.length) {
    return <p className="text-sm text-slate-500">No recurring subscriptions detected.</p>;
  }

  return (
    <ul className="space-y-3">
      {subscriptions.map((sub) => (
        <li key={sub.merchant} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-brand-400" />
            <span className="text-sm font-medium">{sub.merchant}</span>
          </div>
          <span className="text-sm text-slate-400">
            {formatCurrency(sub.averageAmount)} · {sub.occurrences}x
          </span>
        </li>
      ))}
    </ul>
  );
}
