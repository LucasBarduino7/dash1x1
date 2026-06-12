'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { num } from '@/lib/shared/format';

const ORDER = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'Unknown'];

const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#fbbf24', '#fcd34d'];

export function AgeQualifChart({ data }: { data: { key: string; qualif: number }[] }) {
  // Reordenar pela faixa etária convencional
  const sorted = [...data].sort((a, b) => {
    const ia = ORDER.indexOf(a.key);
    const ib = ORDER.indexOf(b.key);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const chartData = sorted.map((d, i) => ({
    age: d.key,
    qualif: Math.round(d.qualif),
    color: COLORS[i % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="age" stroke="#71717a" fontSize={12} tickMargin={6} />
        <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => num(v, { compact: true })} />
        <Tooltip
          contentStyle={{
            background: '#18181c',
            border: '1px solid #27272a',
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: '#f4f4f5' }}
          formatter={(value) => [num(Number(value)), 'Donos de agência (est.)']}
        />
        <Bar dataKey="qualif" name="Donos de agência" radius={[6, 6, 0, 0]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
