import { Calendar, Filter } from 'lucide-react';
import { formatDateBR } from '@/lib/format';
import { RefreshButton } from './RefreshButton';
import { UserBadge } from './UserBadge';

type Props = {
  period: { since: string; until: string };
  filter: string;
};

export function Header({ period, filter }: Props) {
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
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300">
          <Filter className="h-3.5 w-3.5 text-violet-400" />
          Campanhas contendo <strong className="text-violet-200">{filter}</strong>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300">
          <Calendar className="h-3.5 w-3.5 text-emerald-400" />
          {formatDateBR(period.since)} → {formatDateBR(period.until)}
        </span>
        <RefreshButton />
        <UserBadge />
      </div>
    </header>
  );
}
