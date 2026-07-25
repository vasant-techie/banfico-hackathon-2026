import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/format.js';

function TransactionRow({ transaction }) {
  const isCredit = transaction.CreditDebitIndicator === 'Credit';
  const label =
    transaction.MerchantDetails?.MerchantName || transaction.TransactionInformation || 'Transaction';

  return (
    <div className="flex items-center justify-between border-b border-slate-800 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
          }`}
        >
          {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        </span>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-slate-500">{formatDate(transaction.BookingDateTime)}</p>
        </div>
      </div>
      <p className={`text-sm font-semibold ${isCredit ? 'text-emerald-400' : 'text-slate-200'}`}>
        {isCredit ? '+' : '-'}
        {formatCurrency(transaction.Amount?.Amount, transaction.Amount?.Currency)}
      </p>
    </div>
  );
}

export function TransactionList({ transactions, emptyLabel = 'No transactions yet.' }) {
  if (!transactions?.length) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }
  return (
    <div>
      {transactions.map((transaction, index) => (
        <TransactionRow key={transaction.TransactionReference || transaction.TransactionId || index} transaction={transaction} />
      ))}
    </div>
  );
}
