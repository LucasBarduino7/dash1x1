import { cn } from '@/lib/cn';
import { brl, formatDateBR } from '@/lib/format';
import type { BuyerMatch } from '@/lib/types';

const MATCH_LABEL: Record<BuyerMatch['matchType'], { label: string; tone: string }> = {
  phone: { label: '📱 telefone', tone: 'text-emerald-300' },
  email: { label: '✉️ email', tone: 'text-emerald-300' },
  name: { label: '🔍 nome (fuzzy)', tone: 'text-amber-300' },
  override: { label: '🎯 manual', tone: 'text-violet-300' },
  none: { label: '— sem match', tone: 'text-rose-300/70' },
};

const STATUS_LABEL: Record<string, string> = {
  agendado: '🟢 agendado',
  tem_agencia: '🟡 tem agência',
  desqualificado: '🔴 desqualif.',
  nao_contactado: '⚪ não contactado',
  separador: '',
};

export function BuyersTable({ buyers }: { buyers: BuyerMatch[] }) {
  if (buyers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
        Nenhum comprador cadastrado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Data</th>
            <th className="px-3 py-2 font-medium">Comprador</th>
            <th className="px-3 py-2 font-medium">Plano</th>
            <th className="px-3 py-2 text-right font-medium">Total contrato</th>
            <th className="px-3 py-2 text-right font-medium">Recebido no mês</th>
            <th className="px-3 py-2 text-center font-medium">Match</th>
            <th className="px-3 py-2 text-center font-medium">1x1?</th>
          </tr>
        </thead>
        <tbody>
          {buyers.map((b) => {
            const matchInfo = MATCH_LABEL[b.matchType];
            const statusLabel = b.leadStatus ? STATUS_LABEL[b.leadStatus] : '';
            return (
              <tr
                key={b.buyerId}
                className={cn(
                  'border-b border-zinc-900 transition-colors hover:bg-zinc-900/50',
                  !b.is1x1 && 'opacity-50',
                )}
              >
                <td className="px-3 py-3 text-zinc-500 tabular-nums">{b.buyerId}</td>
                <td className="px-3 py-3 text-zinc-300 tabular-nums">{formatDateBR(b.date)}</td>
                <td className="px-3 py-3">
                  <div className="font-medium text-zinc-100">{b.apelido}</div>
                  <div className="mt-0.5 truncate text-[11px] text-zinc-500" title={b.nome}>
                    {b.nome}
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-zinc-300">{b.plano}</td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-300">{brl(b.total)}</td>
                <td className="px-3 py-3 text-right tabular-nums font-medium text-zinc-100">
                  {brl(b.recebidoMaio)}
                </td>
                <td className={cn('px-3 py-3 text-center text-xs', matchInfo.tone)}>
                  {matchInfo.label}
                  {statusLabel && (
                    <div className="mt-0.5 text-[10px] text-zinc-500">{statusLabel}</div>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  {b.is1x1 ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
                      ● sim
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400 ring-1 ring-inset ring-zinc-700/40">
                      ● não
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
