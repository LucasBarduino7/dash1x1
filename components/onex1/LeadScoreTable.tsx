import { brl, formatDateBR } from '@/lib/shared/format';
import type { BuyerMatch } from '@/lib/onex1/types';

type Produto = 'express' | 'growth' | 'club';

/** Valor cheio (preço de lista) de cada produto — âncora da régua. */
export const VALOR_CHEIO: Record<Produto, number> = {
  express: 8000,
  growth: 14000,
  club: 60000,
};

const PRODUTO_LABEL: Record<Produto, string> = {
  express: 'Express',
  growth: 'Growth',
  club: 'Club',
};

/**
 * Detecta o produto pelo nome do plano. "Scale Anual" pode ser Club ou Growth —
 * desempata pelo valor do contrato (>= 25k → Club). Renovação/sem plano → null (fora do score).
 */
export function detectarProduto(plano: string, total: number): Produto | null {
  const p = (plano || '').toLowerCase();
  if (p.includes('express')) return 'express';
  if (p.includes('club')) return 'club';
  if (p.includes('growth')) return 'growth';
  if (p.includes('anual')) return total >= 25000 ? 'club' : 'growth';
  return null;
}

/** Ajuste da nota conforme o faturamento do cliente (quanto maior, mais tem que pagar). */
function ajusteFaturamento(fat: number): number {
  if (fat < 25000) return 1;
  if (fat < 50000) return 0;
  if (fat < 100000) return -1;
  if (fat < 150000) return -2;
  return -3;
}

export type NotaInfo = {
  nota: number | null;
  produto: Produto | null;
  produtoLabel: string;
  cheio: number;
  pago: number;
  pct: number; // 0..1
  motivo?: string; // por que ficou "—"
};

/**
 * Nota de 0 a 10 do comprador:
 *  - base = pago ÷ valor cheio do produto × 10 (pago = recebido no mês);
 *  - ajuste pelo faturamento (mais faturamento exige pagar mais);
 *  - pagou o cheio à vista = 10 (salvo faturamento >= 150k → 8, deveria ir pro Club);
 *  - Club com entrada >= 20k → piso de 7.
 */
export function notaComprador(b: Pick<BuyerMatch, 'plano' | 'total' | 'recebidoMaio' | 'faturamento'>): NotaInfo {
  const produto = detectarProduto(b.plano, b.total);
  const pago = b.recebidoMaio;

  if (!produto) {
    return {
      nota: null,
      produto: null,
      produtoLabel: '—',
      cheio: 0,
      pago,
      pct: 0,
      motivo: 'fora do score',
    };
  }

  const cheio = VALOR_CHEIO[produto];
  const pct = cheio > 0 ? Math.min(1, pago / cheio) : 0;
  const base = {
    nota: null as number | null,
    produto,
    produtoLabel: PRODUTO_LABEL[produto],
    cheio,
    pago,
    pct,
  };

  if (b.faturamento == null) {
    return { ...base, motivo: 'falta faturamento' };
  }

  let nota: number;
  if (pct >= 1) {
    // Pagou o valor cheio do produto à vista.
    nota = b.faturamento >= 150000 ? 8 : 10;
  } else {
    nota = Math.round(pct * 10 + ajusteFaturamento(b.faturamento));
  }

  // Piso do Club: entrada >= 20k garante nota mínima 7.
  if (produto === 'club' && pago >= 20000) nota = Math.max(nota, 7);

  nota = Math.max(0, Math.min(10, nota));
  return { ...base, nota };
}

export function LeadScoreTable({ buyers }: { buyers: BuyerMatch[] }) {
  if (buyers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
        Nenhum comprador 1x1 no mês.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-medium">Data</th>
            <th className="px-3 py-2 font-medium">Comprador</th>
            <th className="px-3 py-2 font-medium">Produto</th>
            <th className="px-3 py-2 text-right font-medium">Pago</th>
            <th className="px-3 py-2 text-right font-medium">Faturamento</th>
            <th className="px-3 py-2 text-center font-medium">Nota</th>
          </tr>
        </thead>
        <tbody>
          {buyers.map((b) => {
            const info = notaComprador(b);
            return (
              <tr
                key={b.buyerId}
                className="border-b border-zinc-200 transition-colors hover:bg-zinc-100"
              >
                <td className="px-3 py-3 text-zinc-700 tabular-nums">{formatDateBR(b.date)}</td>
                <td className="px-3 py-3">
                  <div className="font-medium text-zinc-900">{b.apelido}</div>
                  <div className="mt-0.5 truncate text-[11px] text-zinc-500" title={b.nome}>
                    {b.nome}
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-zinc-700">
                  {info.produto ? (
                    <>
                      {info.produtoLabel}
                      <span className="ml-1 text-zinc-400">({brl(info.cheio)})</span>
                    </>
                  ) : (
                    <span className="text-zinc-400" title={b.plano}>
                      {b.plano || '—'}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-700">
                  {brl(b.recebidoMaio)}
                  {info.produto && (
                    <div className="text-[10px] text-zinc-400">
                      {Math.round(info.pct * 100)}% do produto
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-700">
                  {b.faturamento != null ? brl(b.faturamento) : <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-3 py-3 text-center">
                  {info.nota != null ? (
                    <span className="inline-flex items-center rounded-full bg-tiffany-500/15 px-2.5 py-0.5 text-[12px] font-semibold tabular-nums text-tiffany-700 ring-1 ring-inset ring-tiffany-500/30">
                      {info.nota} / 10
                    </span>
                  ) : (
                    <span className="text-zinc-400" title={info.motivo}>
                      —
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
