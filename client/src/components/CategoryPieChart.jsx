import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../lib/format.js';

const COLORS = ['#3b82f6', '#22d3ee', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#f87171', '#94a3b8'];

export function CategoryPieChart({ data, currency }) {
  if (!data?.length) return <p className="text-sm text-slate-500">No spending data yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          isAnimationActive={false}
        >
          {data.map((entry, index) => (
            <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value, currency)} contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
