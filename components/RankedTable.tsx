import { cn } from '@/lib/cn';
import { brl, num, pct } from '@/lib/format';
import type { RankedRow } from '@/lib/types';

// Semáforo baseado em: taxa de qualificação + volume de qualificados + CPL qualificado
function getSemaphore(
  r: RankedRow,
): { tone: 'good' | 'warn' | 'bad' | 'neutral'; label: string } {
  if (r.leadsTotal === 0 && r.spend < 20) return { tone: 'neutral', label: 'sem dados' };
  if (r.leadsTotal === 0) return { tone: 'bad', label: 'sem leads' };
  if (r.qualificados === 0) return { tone: 'bad', label: 'sem qualif.' };
  if (r.taxaQualificacao >= 30 && r.cplQualificado > 0 && r.cplQualificado <= 250)
    return { tone: 'good', label: 'top' };
  if (r.taxaQualificacao >= 15) return { tone: 'warn', label: 'razoável' };
  return { tone: 'bad', label: 'fraco' };
}

const TONE: Record<string, string> = {
  good: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  warn: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  bad: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  neutral: 'bg-zinc-500/10 text-zinc-400 ring-zinc-700/40',
};

export function RankedTable({
  rows,
  entityLabel = 'Conjunto',
  limit = 20,
}: {
  rows: RankedRow[];
  entityLabel?: string;
  limit?: number;
}) {
  const displayed = rows.slice(0, limit);

  if (displayed.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
        Nenhum {entityLabel.toLowerCase()} encontrado no período.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-medium">{entityLabel}</th>
            <th className="px-3 py-2 text-right font-medium">Invest.</th>
            <th className="px-3 py-2 text-right font-medium">Leads</th>
            <th className="px-3 py-2 text-right font-medium">
              <span title="Donos de agência (amarelo + verde + roxo)">🟡 Agência</span>
            </th>
            <th className="px-3 py-2 text-right font-medium">
              <span title="Agendados (verde)">🟢 Reuniões</span>
            </th>
            <th className="px-3 py-2 text-right font-medium">
              <span title="Dono de agência sem faturamento (roxo)">🟣 Sem fat.</span>
            </th>
            <th className="px-3 py-2 text-right font-medium">
              <span title="Desqualificados (vermelho)">🔴 Descarte</span>
            </th>
            <th className="px-3 py-2 text-right font-medium">Taxa qualif.</th>
            <th className="px-3 py-2 text-right font-medium">CPL qualif.</th>
            <th className="px-3 py-2 text-right font-medium">R$/reunião</th>
            <th className="px-3 py-2 text-center font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((r, idx) => {
            const sem = getSemaphore(r);
            const totalAgencia = r.temAgencia + r.agendados + r.donoSemFaturamento;
            return (
              <tr
                key={r.name + idx}
                className="border-b border-zinc-900 transition-colors hover:bg-zinc-900/50"
              >
                <td className="max-w-[340px] px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-medium tabular-nums text-zinc-400 ring-1 ring-zinc-800">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-zinc-100" title={r.name}>
                        {r.name}
                      </div>
                      {r.id && (
                        <div className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-zinc-500">
                          ID {r.id}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-100">
                  {brl(r.spend)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-300">
                  {num(r.leadsTotal)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-amber-200">
                  {num(totalAgencia)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-emerald-300">
                  {num(r.agendados)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-violet-300">
                  {num(r.donoSemFaturamento)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-rose-300/80">
                  {num(r.desqualificados)}
                </td>
                <td
                  className={cn(
                    'px-3 py-3 text-right tabular-nums',
                    r.taxaQualificacao >= 30
                      ? 'text-emerald-300'
                      : r.taxaQualificacao >= 15
                        ? 'text-amber-300'
                        : 'text-rose-300/80',
                  )}
                >
                  {pct(r.taxaQualificacao)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-100">
                  {r.qualificados > 0 ? brl(r.cplQualificado) : '—'}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-100">
                  {r.agendados > 0 ? brl(r.custoPorReuniao) : '—'}
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
      {rows.length > limit && (
        <p className="mt-3 text-center text-xs text-zinc-500">
          Mostrando top {limit} de {rows.length} {entityLabel.toLowerCase()}s
        </p>
      )}
    </div>
  );
}
