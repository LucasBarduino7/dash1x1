'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Gauge, Users, Wallet, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/shared/cn';

export type EventoTab = 'principais' | 'gastos' | 'compradores';

export const EVENTO_TABS: { key: EventoTab; label: string; icon: LucideIcon }[] = [
  { key: 'principais', label: 'Métricas Principais', icon: Gauge },
  { key: 'gastos', label: 'Gastos do evento', icon: Wallet },
  { key: 'compradores', label: 'Compradores', icon: Users },
];

export function Sidebar({ active }: { active: EventoTab }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function go(key: EventoTab) {
    const p = new URLSearchParams(params);
    p.set('tab', key);
    startTransition(() => router.push(`?${p.toString()}`));
  }

  return (
    <nav
      aria-label="Seções do Evento Presencial"
      className="flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-2 lg:sticky lg:top-6 lg:h-fit lg:w-60 lg:flex-col lg:gap-1"
    >
      {EVENTO_TABS.map((t) => {
        const isActive = t.key === active;
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => go(t.key)}
            disabled={pending}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
              isActive
                ? 'bg-tiffany-500/15 text-tiffany-800 ring-1 ring-inset ring-tiffany-500/40'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900',
              pending && 'opacity-60',
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0',
                isActive ? 'text-tiffany-600' : 'text-zinc-500 group-hover:text-zinc-700',
              )}
            />
            <span className="truncate">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
