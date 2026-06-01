import { Filter } from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';
import { MonthTabs } from './MonthTabs';
import { RefreshButton } from './RefreshButton';
import { UserBadge } from './UserBadge';

type Props = {
  period: { since: string; until: string };
  activeMonth: { since: string; until: string };
  filter: string;
  months: { key: string; label: string }[];
  activeMonthKey: string;
};

export function Header({ period, activeMonth, filter, months, activeMonthKey }: Props) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
          Grupo Scale · Marcos Machado
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50">
          Dashboard 1x1
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Performance das campanhas de captação 1×1 com qualificação manual
        </p>
        <div className="mt-3">
          <MonthTabs months={months} active={activeMonthKey} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300">
          <Filter className="h-3.5 w-3.5 text-violet-400" />
          Campanhas contendo <strong className="text-violet-200">{filter}</strong>
        </span>
        <DateRangePicker
          since={period.since}
          until={period.until}
          minDate={activeMonth.since}
          maxDate={activeMonth.until}
        />
        <RefreshButton />
        <UserBadge />
      </div>
    </header>
  );
}
