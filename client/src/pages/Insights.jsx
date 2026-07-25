import { useEffect, useState } from 'react';
import { getInsights } from '../lib/api.js';
import { CategoryPieChart } from '../components/CategoryPieChart.jsx';
import { MonthlyTrendChart } from '../components/MonthlyTrendChart.jsx';
import { AnomalyList } from '../components/AnomalyList.jsx';
import { SubscriptionList } from '../components/SubscriptionList.jsx';
import { HealthScoreCard } from '../components/HealthScoreCard.jsx';

export function Insights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getInsights();
        if (!cancelled) setInsights(data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Failed to load insights.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50" />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50" />
      </div>
    );
  }

  if (error) return <p className="text-sm text-rose-400">{error}</p>;
  if (!insights) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Insights</h1>

      <HealthScoreCard totals={insights.totals} health={insights.health} narrative={insights.narrative} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Spending by category</h2>
          <CategoryPieChart data={insights.categoryBreakdown} />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Income vs. expense by month</h2>
          <MonthlyTrendChart data={insights.monthlyTrend} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Unusual spending</h2>
          <AnomalyList anomalies={insights.anomalies} />
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Detected subscriptions</h2>
          <SubscriptionList subscriptions={insights.subscriptions} />
        </div>
      </div>
    </div>
  );
}
