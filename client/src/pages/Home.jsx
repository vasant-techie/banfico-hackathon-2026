import { Navigate, Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, PiggyBank, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Unified financial visibility',
    description: 'All your accounts, balances, and transactions aggregated into one live dashboard.',
  },
  {
    icon: PiggyBank,
    title: 'Intelligent spending insights',
    description: 'Category breakdowns, income vs. expense trends, and unusual spending flagged automatically.',
  },
  {
    icon: MessageCircle,
    title: 'Conversational assistant',
    description: 'Ask questions in plain English, or ask it to move money to savings for you.',
  },
];

export function Home() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-svh bg-slate-950 text-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <PiggyBank className="h-6 w-6 text-brand-500" />
          Finlight
        </div>
        <Link
          to="/login"
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800"
        >
          Log in
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Your finances, <span className="text-brand-500">understood</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Finlight aggregates your accounts and transactions, surfaces the insights that matter, and lets an
          AI assistant act on your behalf — all backed by Open Banking APIs.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold text-white hover:bg-brand-700"
        >
          Get started
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-24 sm:grid-cols-3 sm:px-6">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <Icon className="h-6 w-6 text-brand-500" />
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-slate-400">{description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
