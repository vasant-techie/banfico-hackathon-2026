import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getAccount, getBalances, listTransactions } from '../lib/api.js';
import { TransactionList } from '../components/TransactionList.jsx';
import { formatCurrency } from '../lib/format.js';

export function AccountDetail() {
  const { accountId } = useParams();
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [accountData, balances, txns] = await Promise.all([
          getAccount(accountId),
          getBalances(accountId),
          listTransactions(accountId),
        ]);
        if (cancelled) return;
        setAccount(accountData);
        setBalance(balances?.[0] || null);
        setTransactions(
          [...txns].sort((a, b) => new Date(b.BookingDateTime) - new Date(a.BookingDateTime))
        );
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Failed to load account.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50" />
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm text-slate-400">{account?.Nickname || 'Account'}</p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(balance?.Amount?.Amount, balance?.Amount?.Currency || account?.Currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {account?.AccountTypeCode} · {account?.Account?.[0]?.Identification}
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Transaction history</h2>
        <TransactionList transactions={transactions} />
      </div>
    </div>
  );
}
