import type { LeadRow, LeadStatus } from '@/lib/types';
import { formatDateBR } from '@/lib/format';

const STATUS_META: Record<LeadStatus, { label: string; dot: string; text: string }> = {
  agendado: { label: 'Agendado', dot: 'bg-emerald-400', text: 'text-emerald-200' },
  tem_agencia: { label: 'Tem agência', dot: 'bg-amber-400', text: 'text-amber-200' },
  dono_sem_faturamento: {
    label: 'Sem faturamento',
    dot: 'bg-violet-400',
    text: 'text-violet-200',
  },
  desqualificado: { label: 'Desqualificado', dot: 'bg-rose-400', text: 'text-rose-200' },
  nao_contactado: { label: 'Não contactado', dot: 'bg-zinc-500', text: 'text-zinc-300' },
  separador: { label: '—', dot: 'bg-zinc-700', text: 'text-zinc-500' },
};

export function LeadsTable({ rows }: { rows: LeadRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
        Nenhum lead encontrado nessa data.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-medium">Nome / Email</th>
            <th className="px-3 py-2 font-medium">Telefone</th>
            <th className="px-3 py-2 font-medium">Faturamento</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Conjunto</th>
            <th className="px-3 py-2 font-medium">Anúncio</th>
            <th className="px-3 py-2 text-right font-medium">Data</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const sm = STATUS_META[r.status];
            return (
              <tr
                key={`${r.email || r.phone}-${idx}`}
                className="border-b border-zinc-900 transition-colors hover:bg-zinc-900/50"
              >
                <td className="max-w-[260px] px-3 py-3">
                  <div className="truncate font-medium text-zinc-100" title={r.nome || r.email}>
                    {r.nome || '—'}
                  </div>
                  <div className="truncate text-[11px] text-zinc-500" title={r.email}>
                    {r.email || '—'}
                  </div>
                </td>
                <td className="px-3 py-3 tabular-nums text-zinc-300">{r.phone || '—'}</td>
                <td className="max-w-[160px] truncate px-3 py-3 text-zinc-300" title={r.faturamento}>
                  {r.faturamento || '—'}
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center gap-1.5 ${sm.text}`}>
                    <span className={`h-2 w-2 rounded-full ${sm.dot}`} />
                    {sm.label}
                  </span>
                </td>
                <td className="max-w-[220px] px-3 py-3">
                  <div className="truncate text-zinc-200" title={r.adsetName || r.adsetId}>
                    {r.adsetName || '—'}
                  </div>
                  {r.adsetId && (
                    <div className="truncate text-[10px] uppercase tracking-wider text-zinc-500">
                      {r.adsetId}
                    </div>
                  )}
                </td>
                <td className="max-w-[220px] px-3 py-3">
                  <div className="truncate text-zinc-200" title={r.adName || r.adId}>
                    {r.adName || '—'}
                  </div>
                  {r.adId && (
                    <div className="truncate text-[10px] uppercase tracking-wider text-zinc-500">
                      {r.adId}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-400">
                  {r.date ? formatDateBR(r.date) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-right text-xs text-zinc-500">{rows.length} leads</p>
    </div>
  );
}
