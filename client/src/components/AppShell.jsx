import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, LineChart, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ChatWidget } from './ChatWidget.jsx';

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`;

export function AppShell() {
  const { logout } = useAuth();

  return (
    <div className="min-h-svh bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <Wallet className="h-5 w-5 text-brand-500" />
            <span>Finlight</span>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink to="/dashboard" className={navLinkClass} end>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink to="/insights" className={navLinkClass}>
              <LineChart className="h-4 w-4" />
              Insights
            </NavLink>
            <button
              type="button"
              onClick={logout}
              className="ml-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <ChatWidget />
    </div>
  );
}
