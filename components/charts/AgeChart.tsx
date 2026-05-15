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
import { brl, num } from '@/lib/format';
import type { BreakdownRow } from '@/lib/types';

const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'];

export function AgeChart({ data }: { data: BreakdownRow[] }) {
  const chartData = data.map((d, i) => ({
    age: d.key,
    leads: d.leads,
    spend: d.spend,
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
          formatter={(value, name) => {
            const v = Number(value);
            if (name === 'Investimento') return [brl(v), String(name)];
            return [num(v), String(name)];
          }}
        />
        <Bar dataKey="leads" name="Leads" radius={[6, 6, 0, 0]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
