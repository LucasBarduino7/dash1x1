'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { brl, num } from '@/lib/shared/format';
import type { BreakdownRow } from '@/lib/onex1/types';

export function RegionChart({ data }: { data: BreakdownRow[] }) {
  const chartData = data.map((d) => ({
    region: d.key,
    leads: d.leads,
    spend: d.spend,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 30)}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
        <XAxis
          type="number"
          stroke="#71717a"
          fontSize={12}
          tickFormatter={(v) => num(v, { compact: true })}
        />
        <YAxis
          type="category"
          dataKey="region"
          stroke="#71717a"
          fontSize={12}
          width={110}
          tickMargin={4}
        />
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
        <Bar dataKey="leads" name="Leads" fill="#10b981" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
