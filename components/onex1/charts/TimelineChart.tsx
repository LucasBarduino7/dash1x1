'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { brl, formatDayMonthBR, num } from '@/lib/shared/format';

type Props = {
  data: { date: string; spend: number; leads: number }[];
};

export function TimelineChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: formatDayMonthBR(d.date),
    spend: d.spend,
    leads: d.leads,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0abab5" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#0abab5" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="leads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickMargin={8} />
        <YAxis
          yAxisId="left"
          stroke="#71717a"
          fontSize={12}
          tickFormatter={(v) => brl(v, { compact: true })}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#71717a"
          fontSize={12}
          tickFormatter={(v) => num(v, { compact: true })}
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
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }}
          iconType="circle"
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="spend"
          name="Investimento"
          stroke="#0abab5"
          strokeWidth={2}
          fill="url(#spend)"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="leads"
          name="Leads"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3, fill: '#10b981' }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
