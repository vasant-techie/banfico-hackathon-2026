import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogIn, PiggyBank } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export function Login() {
  const { isAuthenticated, login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      // error surfaced via auth context
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2 text-lg font-semibold">
          <PiggyBank className="h-6 w-6 text-brand-500" />
          Finlight
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4"
        >
          <h1 className="text-xl font-semibold">Log in to your accounts</h1>
          <div className="space-y-1">
            <label htmlFor="username" className="text-sm text-slate-400">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm text-slate-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
