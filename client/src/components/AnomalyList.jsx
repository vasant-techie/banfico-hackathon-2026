import { AlertOctagon } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/format.js';

export function AnomalyList({ anomalies }) {
  if (!anomalies?.length) {
    return <p className="text-sm text-slate-500">No unusual spending detected.</p>;
  }

  return (
    <ul className="space-y-3">
      {anomalies.map(({ transaction, category, reason }, index) => (
        <li key={transaction.TransactionReference || index} className="flex items-start gap-3">
          <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {transaction.MerchantDetails?.MerchantName || transaction.TransactionInformation || category}
            </p>
            <p className="text-xs text-slate-500">
              {category} · {formatDate(transaction.BookingDateTime)} · {reason}
            </p>
          </div>
          <p className="text-sm font-semibold text-amber-300">
            {formatCurrency(transaction.Amount?.Amount, transaction.Amount?.Currency)}
          </p>
        </li>
      ))}
    </ul>
  );
}
