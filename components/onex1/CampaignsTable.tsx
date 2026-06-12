import { cn } from '@/lib/shared/cn';
import { brl, num, pct } from '@/lib/shared/format';
import type { CampaignRow } from '@/lib/onex1/types';

// Limpa o nome da campanha pra ficar mais legível (mostra só os tags relevantes)
function shortName(name: string): string {
  return name
    .replace(/\[PIXELMQL\]|\[FORMS\]|\[SITE\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Semáforo baseado em CPL bruto + connect rate
function getSemaphore(c: CampaignRow): {
  tone: 'good' | 'warn' | 'bad' | 'neutral';
  label: string;
} {
  if (c.spend < 50 || c.leads === 0) return { tone: 'neutral', label: 'sem dados' };
  if (c.cpl <= 80 && c.connectRate >= 70) return { tone: 'good', label: 'performando' };
  if (c.cpl <= 200 && c.connectRate >= 50) return { tone: 'warn', label: 'atenção' };
  return { tone: 'bad', label: 'fraco' };
}

const TONE: Record<string, string> = {
  good: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  warn: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  bad: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  neutral: 'bg-zinc-500/10 text-zinc-500 ring-zinc-300',
};

export function CampaignsTable({ rows }: { rows: CampaignRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
        Nenhuma campanha no período.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-medium">Campanha</th>
            <th className="px-3 py-2 text-right font-medium">Investimento</th>
            <th className="px-3 py-2 text-right font-medium">CPM</th>
            <th className="px-3 py-2 text-right font-medium">CPC</th>
            <th className="px-3 py-2 text-right font-medium">CTR</th>
            <th className="px-3 py-2 text-right font-medium">Cliques no link</th>
            <th className="px-3 py-2 text-right font-medium">LP Views</th>
            <th className="px-3 py-2 text-right font-medium">Connect rate</th>
            <th className="px-3 py-2 text-right font-medium">Leads</th>
            <th className="px-3 py-2 text-right font-medium">CPL</th>
            <th className="px-3 py-2 text-center font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const sem = getSemaphore(c);
            return (
              <tr
                key={c.id}
                className="border-b border-zinc-200 transition-colors hover:bg-zinc-100"
              >
                <td className="max-w-[280px] px-3 py-3">
                  <div className="truncate font-medium text-zinc-900" title={c.name}>
                    {shortName(c.name)}
                  </div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
                    ID {c.id}
                  </div>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-900">{brl(c.spend)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{brl(c.cpm)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{brl(c.cpc)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{pct(c.ctr)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{num(c.linkClicks)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-700">
                  {num(c.landingPageViews)}
                </td>
                <td
                  className={cn(
                    'px-3 py-3 text-right tabular-nums',
                    c.connectRate >= 70
                      ? 'text-emerald-300'
                      : c.connectRate >= 50
                        ? 'text-amber-300'
                        : 'text-rose-300',
                  )}
                >
                  {pct(c.connectRate)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-900">{num(c.leads)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-900">
                  {c.leads > 0 ? brl(c.cpl) : '—'}
                </td>
                <td className="px-3 py-3 text-center">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset',
                      TONE[sem.tone],
                    )}
                  >
                    ● {sem.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
