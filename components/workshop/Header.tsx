import { CalendarDays, Filter } from 'lucide-react';
import { DayCalendar } from './DayCalendar';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { UserBadge } from '@/components/shared/UserBadge';
import { formatDateBR } from '@/lib/shared/format';

type Props = {
  event: { start: string; end: string; label: string };
  daysToEvent: number;
  filter: string;
  selectedDay: string | null;
  periodMin: string;
  periodMax: string;
};

function countdownLabel(days: number): string {
  if (days > 1) return `faltam ${days} dias`;
  if (days === 1) return 'é amanhã';
  if (days === 0) return 'é hoje';
  return 'evento encerrado';
}

export function Header({
  event,
  daysToEvent,
  filter,
  selectedDay,
  periodMin,
  periodMax,
}: Props) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0abab5]">
          Grupo Scale · Marcos Machado
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0f1716]">
          {event.label}
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#5b6b69]">
          <CalendarDays className="h-4 w-4 text-[#0abab5]" />
          {formatDateBR(event.start)} e {formatDateBR(event.end)}
          <span className="rounded-md bg-[#0abab5]/12 px-2 py-0.5 text-xs font-medium text-[#099a96]">
            {countdownLabel(daysToEvent)}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="hidden items-center gap-1.5 rounded-lg border border-[#e3eceb] bg-white px-3 py-1.5 text-xs text-[#5b6b69] lg:inline-flex">
          <Filter className="h-3.5 w-3.5 text-[#0abab5]" />
          Campanhas contendo <strong className="text-[#0abab5]">{filter}</strong>
        </span>
        <DayCalendar selectedDay={selectedDay} min={periodMin} max={periodMax} />
        <RefreshButton />
        <UserBadge />
      </div>
    </header>
  );
}
