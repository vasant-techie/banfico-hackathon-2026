import { useEffect, useState } from 'react';
import { getBalances, getInsights, listAccounts, listTransactions } from '../lib/api.js';
import { AccountCard } from '../components/AccountCard.jsx';
import { BalanceSummary } from '../components/BalanceSummary.jsx';
import { TransactionList } from '../components/TransactionList.jsx';
import { HealthBanner } from '../components/HealthBanner.jsx';

export function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [balancesByAccount, setBalancesByAccount] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const accountList = await listAccounts();
        if (cancelled) return;
        setAccounts(accountList);

        const ids = accountList.map((a) => a.AccountId || a.Id);
        const [balancesResults, transactionsResults] = await Promise.all([
          Promise.all(ids.map((id) => getBalances(id).catch(() => []))),
          Promise.all(ids.map((id) => listTransactions(id).catch(() => []))),
        ]);
        if (cancelled) return;

        const balMap = {};
        ids.forEach((id, i) => {
          balMap[id] = balancesResults[i]?.[0] || null;
        });
        setBalancesByAccount(balMap);

        const allTransactions = transactionsResults
          .flat()
          .sort((a, b) => new Date(b.BookingDateTime) - new Date(a.BookingDateTime))
          .slice(0, 8);
        setRecentTransactions(allTransactions);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load your accounts.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadInsights() {
      setInsightsLoading(true);
      try {
        const data = await getInsights();
        if (!cancelled) setInsights(data);
      } catch {
        // insights are a nice-to-have; fail silently on the dashboard
      } finally {
        if (!cancelled) setInsightsLoading(false);
      }
    }

    load();
    loadInsights();
    return () => {
      cancelled = true;
    };
  }, []);

  const currency = accounts[0]?.Currency || 'GBP';
  const total = Object.values(balancesByAccount).reduce(
    (sum, balance) => sum + Number(balance?.Amount?.Amount ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <HealthBanner insights={insights} loading={insightsLoading} />

      {error && <p className="text-sm text-rose-400">{error}</p>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50" />
          ))}
        </div>
      ) : (
        <>
          <BalanceSummary total={total} currency={currency} accountCount={accounts.length} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.AccountId || account.Id}
                account={account}
                balance={balancesByAccount[account.AccountId || account.Id]}
              />
            ))}
          </div>
        </>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Recent activity</h2>
        <TransactionList transactions={recentTransactions} />
      </div>
    </div>
  );
}
