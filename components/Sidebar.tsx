'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { cn } from '@/lib/cn';
import { TABS, type TabKey } from '@/lib/tabs';

export function Sidebar({ active }: { active: TabKey }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function go(key: TabKey) {
    const p = new URLSearchParams(params);
    p.set('tab', key);
    startTransition(() => router.push(`?${p.toString()}`));
  }

  return (
    <nav
      aria-label="Seções do dashboard"
      className="flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 p-2 lg:sticky lg:top-6 lg:h-fit lg:w-60 lg:flex-col lg:gap-1"
    >
      {TABS.map((t) => {
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
                ? 'bg-violet-500/15 text-violet-100 ring-1 ring-inset ring-violet-500/40'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100',
              pending && 'opacity-60',
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0',
                isActive ? 'text-violet-300' : 'text-zinc-500 group-hover:text-zinc-300',
              )}
            />
            <span className="truncate">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
