'use client';

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { brl, formatDayMonthBR, num } from '@/lib/shared/format';

type Props = {
  data: { date: string; ingressos: number; spend: number }[];
};

export function SalesChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: formatDayMonthBR(d.date),
    ingressos: d.ingressos,
    spend: d.spend,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0abab5" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#0abab5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3eceb" vertical={false} />
        <XAxis dataKey="date" stroke="#9aa5a3" fontSize={12} tickMargin={8} />
        <YAxis
          yAxisId="left"
          stroke="#9aa5a3"
          fontSize={12}
          allowDecimals={false}
          tickFormatter={(v) => num(v, { compact: true })}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#9aa5a3"
          fontSize={12}
          tickFormatter={(v) => brl(v, { compact: true })}
        />
        <Tooltip
          contentStyle={{
            background: '#ffffff',
            border: '1px solid #e3eceb',
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: '#0f1716' }}
          formatter={(value, name) => {
            const v = Number(value);
            if (name === 'Investimento') return [brl(v), String(name)];
            return [num(v), String(name)];
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} iconType="circle" />
        <Bar
          yAxisId="left"
          dataKey="ingressos"
          name="Ingressos"
          fill="#059669"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="spend"
          name="Investimento"
          stroke="#0abab5"
          strokeWidth={2}
          fill="url(#spend)"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
