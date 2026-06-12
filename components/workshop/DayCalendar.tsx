'use client';

import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/shared/cn';

type Props = {
  /** Dia selecionado (yyyy-mm-dd) ou null = período completo */
  selectedDay: string | null;
  /** Limites selecionáveis (yyyy-mm-dd) */
  min: string;
  max: string;
};

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
function ymd(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export function DayCalendar({ selectedDay, min, max }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const initial = selectedDay ?? max;
  const [iy, im] = initial.split('-').map(Number);
  const [view, setView] = useState<{ y: number; m: number }>({ y: iy, m: im - 1 });

  const navigate = (day: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (day) params.set('day', day);
    else params.delete('day');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const minMonth = min.slice(0, 7);
  const maxMonth = max.slice(0, 7);
  const viewMonth = `${view.y}-${pad(view.m + 1)}`;
  const canPrev = viewMonth > minMonth;
  const canNext = viewMonth < maxMonth;

  const shiftMonth = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const label = selectedDay
    ? `${selectedDay.slice(8, 10)}/${selectedDay.slice(5, 7)}`
    : 'Todos os dias';

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* gatilho compacto */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
          selectedDay
            ? 'border-[#0abab5]/50 bg-[#0abab5]/10 text-[#099a96]'
            : 'border-[#e3eceb] bg-white text-[#5b6b69] hover:bg-[#f1f6f5]',
        )}
      >
        <CalendarDays className="h-3.5 w-3.5 text-[#0abab5]" />
        {label}
      </button>

      {/* painel expandido (hover / clique) */}
      {open && (
        <div className="absolute right-0 top-full z-50 pt-2">
          <div className="w-60 rounded-2xl border border-[#e3eceb] bg-white p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                disabled={!canPrev}
                onClick={() => shiftMonth(-1)}
                className="rounded-md p-1 text-[#5b6b69] hover:bg-[#f1f6f5] disabled:opacity-30"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-[#0f1716]">
                {MONTHS[view.m]} {view.y}
              </span>
              <button
                type="button"
                disabled={!canNext}
                onClick={() => shiftMonth(1)}
                className="rounded-md p-1 text-[#5b6b69] hover:bg-[#f1f6f5] disabled:opacity-30"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-[#8a9492]">
              {WEEKDAYS.map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (d === null) return <span key={i} />;
                const day = ymd(view.y, view.m, d);
                const disabled = day < min || day > max;
                const isSelected = day === selectedDay;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => navigate(day)}
                    className={cn(
                      'aspect-square rounded-md text-xs tabular-nums transition-colors',
                      disabled && 'cursor-default text-stone-300',
                      !disabled && !isSelected && 'text-[#0f1716] hover:bg-[#f1f6f5]',
                      isSelected && 'bg-[#0abab5] font-semibold text-white',
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {selectedDay && (
              <button
                type="button"
                onClick={() => navigate(null)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#e3eceb] bg-white py-1.5 text-xs text-[#0f1716] transition-colors hover:bg-[#f1f6f5]"
              >
                <X className="h-3.5 w-3.5" />
                Período completo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
