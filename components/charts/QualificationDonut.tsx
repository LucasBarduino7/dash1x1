'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { LeadStats } from '@/lib/types';
import { num, pct } from '@/lib/format';

export function QualificationDonut({ stats }: { stats: LeadStats }) {
  const data = [
    { name: 'Agendados', value: stats.agendados, color: '#10b981' },
    { name: 'Tem agência', value: stats.temAgencia, color: '#f59e0b' },
    { name: 'Sem faturamento', value: stats.donoSemFaturamento, color: '#a855f7' },
    { name: 'Desqualificados', value: stats.desqualificados, color: '#ef4444' },
    { name: 'Não contactados', value: stats.naoContactados, color: '#52525b' },
  ];
  const total = data.reduce((a, b) => a + b.value, 0) || 1;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={64}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
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
              return [`${num(v)} (${pct((v / total) * 100)})`, String(name)];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-zinc-50 tabular-nums">{num(stats.qualificados)}</span>
        <span className="text-[10px] uppercase tracking-wider text-zinc-400">donos de agência</span>
        <span className="mt-1 text-xs text-zinc-500">de {num(stats.total)} leads</span>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 rounded-lg bg-zinc-900/60 px-2.5 py-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 text-zinc-300">{d.name}</span>
            <span className="tabular-nums text-zinc-100">{num(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
