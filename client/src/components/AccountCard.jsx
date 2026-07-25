import { Link } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import { formatCurrency } from '../lib/format.js';

export function AccountCard({ account, balance }) {
  const accountId = account.AccountId || account.Id;
  const currency = account.Currency || balance?.Amount?.Currency || 'GBP';
  const amount = balance?.Amount?.Amount ?? account.Balance;

  return (
    <Link
      to={`/accounts/${accountId}`}
      className="block rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition-colors hover:border-brand-600"
    >
      <div className="flex items-center gap-2 text-slate-400">
        <Landmark className="h-4 w-4" />
        <span className="text-sm">{account.Nickname || 'Account'}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold">{formatCurrency(amount, currency)}</p>
      <p className="mt-1 text-xs text-slate-500">
        {account.AccountTypeCode || 'Account'} · {account.Account?.[0]?.Identification || accountId}
      </p>
    </Link>
  );
}
