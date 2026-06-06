import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { brl, num, pct } from '@/lib/format';
import type { ValidatedAdset } from '@/lib/types';

function taxaTone(taxa: number): string {
  if (taxa >= 40) return 'text-emerald-300';
  if (taxa >= 25) return 'text-amber-300';
  return 'text-rose-300/80';
}

export function ValidatedTable({ rows }: { rows: ValidatedAdset[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
        Nenhum par público + criativo validado ainda no período. Um público entra aqui
        quando passa do investimento mínimo mantendo a taxa de agendamento mínima — e
        cada criativo só conta se também bater essa taxa.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((r, idx) => (
        <div
          key={r.id || r.name + idx}
          className="overflow-hidden rounded-xl border border-emerald-500/25 bg-emerald-500/[0.03]"
        >
          {/* Cabeçalho do público */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-400" />
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
            <div className="flex items-center gap-5 text-right">
              <Metric label="Invest." value={brl(r.spend)} />
              <Metric label="Leads" value={num(r.leadsTotal)} />
              <Metric label="Agendados" value={num(r.agendados)} tone="text-emerald-300" />
              <Metric
                label="Taxa agend."
                value={pct(r.taxaAgendamento)}
                tone={taxaTone(r.taxaAgendamento)}
              />
            </div>
          </div>

          {/* Criativos do público */}
          <div className="px-4 py-3">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">
              Criativos validados ({r.criativos.length})
            </div>
            {r.criativos.length === 0 ? (
              <p className="py-2 text-xs text-zinc-500">
                Público validado, mas sem criativo identificado (a planilha não trouxe o anúncio destes leads).
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="py-1.5 pr-3 font-medium">Anúncio</th>
                    <th className="px-3 py-1.5 text-right font-medium">Leads</th>
                    <th className="px-3 py-1.5 text-right font-medium">🟢 Agendados</th>
                    <th className="px-3 py-1.5 text-right font-medium">Taxa agend.</th>
                  </tr>
                </thead>
                <tbody>
                  {r.criativos.map((c, i) => (
                    <tr key={c.id || c.name + i} className="border-t border-zinc-900">
                      <td className="max-w-[360px] py-2 pr-3">
                        <div className="truncate text-zinc-200" title={c.name}>
                          {c.name}
                        </div>
                        {c.id && c.id !== c.name && (
                          <div className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-zinc-600">
                            ID {c.id}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                        {num(c.leadsTotal)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-300">
                        {num(c.agendados)}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-2 text-right font-medium tabular-nums',
                          taxaTone(c.taxaAgendamento),
                        )}
                      >
                        {pct(c.taxaAgendamento)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Metric({
  label,
  value,
  tone = 'text-zinc-100',
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="shrink-0">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={cn('tabular-nums font-medium', tone)}>{value}</div>
    </div>
  );
}
