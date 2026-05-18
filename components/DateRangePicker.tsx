'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Calendar } from 'lucide-react';

type Props = {
  since: string;
  until: string;
  /** Limites permitidos (mês ativo). */
  minDate: string;
  maxDate: string;
};

export function DateRangePicker({ since, until, minDate, maxDate }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(next: { since?: string; until?: string }) {
    const p = new URLSearchParams(params);
    const newSince = next.since ?? since;
    const newUntil = next.until ?? until;
    // Garante since <= until
    const s = newSince <= newUntil ? newSince : newUntil;
    const u = newSince <= newUntil ? newUntil : newSince;
    p.set('since', s);
    p.set('until', u);
    startTransition(() => router.push(`?${p.toString()}`));
  }

  function setToday() {
    const today = new Date().toISOString().slice(0, 10);
    const clamped =
      today < minDate ? minDate : today > maxDate ? maxDate : today;
    update({ since: clamped, until: clamped });
  }

  function setFullMonth() {
    update({ since: minDate, until: maxDate });
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-300">
      <Calendar className="h-3.5 w-3.5 text-emerald-400" />
      <input
        type="date"
        value={since}
        min={minDate}
        max={maxDate}
        onChange={(e) => update({ since: e.target.value })}
        disabled={pending}
        style={{ colorScheme: 'dark' }}
        className="bg-transparent text-zinc-100 outline-none"
      />
      <span className="text-zinc-600">→</span>
      <input
        type="date"
        value={until}
        min={minDate}
        max={maxDate}
        onChange={(e) => update({ until: e.target.value })}
        disabled={pending}
        style={{ colorScheme: 'dark' }}
        className="bg-transparent text-zinc-100 outline-none"
      />
      <span className="mx-1 h-4 w-px bg-zinc-700" />
      <button
        type="button"
        onClick={setToday}
        disabled={pending}
        className="rounded px-2 py-0.5 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      >
        Hoje
      </button>
      <button
        type="button"
        onClick={setFullMonth}
        disabled={pending}
        className="rounded px-2 py-0.5 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      >
        Mês
      </button>
    </div>
  );
}
