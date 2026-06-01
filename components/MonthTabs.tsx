'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/cn';

type MonthOption = { key: string; label: string };

export function MonthTabs({
  months,
  active,
}: {
  months: MonthOption[];
  active: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function go(key: string) {
    if (key === active) return;
    const p = new URLSearchParams(params);
    p.set('month', key);
    // Troca de mês: zera o date picker pra voltar ao mês inteiro.
    p.delete('since');
    p.delete('until');
    startTransition(() => router.push(`?${p.toString()}`));
  }

  return (
    <nav
      aria-label="Mês"
      className="inline-flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1"
    >
      <CalendarRange className="ml-1.5 mr-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
      {months.map((m) => {
        const isActive = m.key === active;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => go(m.key)}
            disabled={pending}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all',
              isActive
                ? 'bg-violet-500/20 text-violet-100 ring-1 ring-inset ring-violet-500/40'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100',
              pending && 'opacity-60',
            )}
          >
            {m.label}
          </button>
        );
      })}
    </nav>
  );
}
