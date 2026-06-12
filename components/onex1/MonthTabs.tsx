'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/shared/cn';

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
      className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1"
    >
      <CalendarRange className="ml-1.5 mr-0.5 h-3.5 w-3.5 shrink-0 text-tiffany-600" />
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
                ? 'bg-tiffany-500/20 text-tiffany-800 ring-1 ring-inset ring-tiffany-500/40'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900',
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
