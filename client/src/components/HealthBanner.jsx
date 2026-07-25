import { AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

const STYLES = {
  Healthy: { icon: CheckCircle2, classes: 'border-emerald-800 bg-emerald-500/10 text-emerald-300' },
  Watch: { icon: AlertTriangle, classes: 'border-amber-800 bg-amber-500/10 text-amber-300' },
  'At risk': { icon: AlertTriangle, classes: 'border-rose-800 bg-rose-500/10 text-rose-300' },
  Unknown: { icon: Sparkles, classes: 'border-slate-700 bg-slate-800/50 text-slate-300' },
};

export function HealthBanner({ insights, loading }) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="h-4 w-40 rounded bg-slate-800" />
        <div className="mt-3 h-3 w-full rounded bg-slate-800" />
      </div>
    );
  }

  if (!insights) return null;

  const style = STYLES[insights.health?.label] || STYLES.Unknown;
  const Icon = style.icon;

  return (
    <div className={`flex gap-3 rounded-2xl border p-5 ${style.classes}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">Financial health: {insights.health?.label || 'Unknown'}</p>
        <p className="mt-1 text-sm opacity-90">{insights.narrative}</p>
      </div>
    </div>
  );
}
