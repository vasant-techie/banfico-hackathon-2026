import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../lib/format.js';

export function MonthlyTrendChart({ data, currency }) {
  if (!data?.length) return <p className="text-sm text-slate-500">No transaction history yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip formatter={(value) => formatCurrency(value, currency)} contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
        <Legend />
        <Bar dataKey="income" fill="#34d399" name="Income" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="expense" fill="#f87171" name="Expense" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
