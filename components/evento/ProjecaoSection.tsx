// Módulo "Projeção da Alavanca — Evento Presencial".
// Apresentacional puro (recebe tudo via props). Reusa KPI/Card e a paleta do dash.

import { Gauge, HandCoins, ShoppingBag, Target } from 'lucide-react';
import { brl, formatDateBR, num, pct } from '@/lib/shared/format';
import { cn } from '@/lib/shared/cn';
import { KPI } from '@/components/onex1/KPI';
import { Card } from '@/components/onex1/Card';
import type { ProjecaoData, ProjecaoRow, Status, RowFormat } from '@/lib/evento/projecao';

const roasFmt = (v: number) => `${v.toFixed(2).replace('.', ',')}×`;

function fmt(format: RowFormat, v: number | null): string {
  if (v == null) return '—';
  if (format === 'brl') return brl(v);
  if (format === 'pct') return pct(v);
  return num(v);
}

const STATUS_TONE = {
  good: 'good',
  warn: 'warn',
  bad: 'bad',
  neutral: 'neutral',
} as const;

const STATUS_PILL: Record<Status, { dot: string; text: string; label: string }> = {
  good: { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'No alvo' },
  warn: { dot: 'bg-amber-500', text: 'text-amber-700', label: 'Atenção' },
  bad: { dot: 'bg-rose-500', text: 'text-rose-700', label: 'Abaixo' },
  neutral: { dot: 'bg-zinc-300', text: 'text-zinc-500', label: '—' },
};

/** Status pontual de um KPI de topo (valor vs meta). */
function kpiStatus(atual: number | null, meta: number, menorMelhor: boolean): Status {
  if (atual == null || atual <= 0 || meta <= 0) return 'neutral';
  const score = menorMelhor ? meta / atual : atual / meta;
  if (score >= 1) return 'good';
  if (score >= 0.8) return 'warn';
  return 'bad';
}

export function ProjecaoSection({ p }: { p: ProjecaoData }) {
  const roasMeta = p.roasMeta;

  const vendasRow = p.rows.find((r) => r.key === 'vendas');
  const vendasStatus: Status = vendasRow?.status ?? 'neutral';
  const cacStatus = kpiStatus(p.cacAtual, p.cacMeta, true);
  const reuniaoStatus = kpiStatus(p.custoReuniaoAtual, p.custoReuniaoMeta, true);
  const roasStatus = kpiStatus(p.roasAtual, roasMeta ?? 0, false);

  return (
    <div className="space-y-6">
      {!p.configurada && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Faltam <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">data_inicio</code>,{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">data_fim</code> e{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">preco_venda</code> em{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">data/projecao_evento.json</code>.
          Sem as datas, o pace (esperado até hoje) não é calculado.
        </div>
      )}

      {/* 1. Faixa de KPIs de topo */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPI
          label="Vendas"
          value={`${num(p.vendasRealizado)} / ${num(p.vendasMeta)}`}
          hint="Realizado / meta da campanha"
          icon={ShoppingBag}
          tone={STATUS_TONE[vendasStatus]}
          size="lg"
        />
        <KPI
          label="CAC atual"
          value={p.cacAtual != null ? brl(p.cacAtual) : '—'}
          hint={`Meta ${brl(p.cacMeta)} · menor melhor`}
          icon={Target}
          tone={STATUS_TONE[cacStatus]}
          size="lg"
        />
        <KPI
          label="Custo por reunião"
          value={p.custoReuniaoAtual != null ? brl(p.custoReuniaoAtual) : '—'}
          hint={`Meta ${brl(p.custoReuniaoMeta)} · menor melhor`}
          icon={HandCoins}
          tone={STATUS_TONE[reuniaoStatus]}
          size="lg"
        />
        <KPI
          label="ROAS atual"
          value={p.roasAtual != null ? roasFmt(p.roasAtual) : '—'}
          hint={roasMeta != null ? `Meta ${roasFmt(roasMeta)}` : 'Preencha preco_venda'}
          icon={Gauge}
          tone={STATUS_TONE[roasStatus]}
          size="lg"
        />
      </section>

      {/* 3. Barra de progresso da campanha */}
      <Card
        title="Progresso da campanha"
        subtitle={
          p.diasCampanha > 0
            ? `${p.dataInicio ? formatDateBR(p.dataInicio) : '?'} → ${p.dataFim ? formatDateBR(p.dataFim) : '?'} · dia ${p.diasDecorridos} de ${p.diasCampanha}`
            : 'Defina data_inicio e data_fim para acompanhar o pace.'
        }
      >
        <div className="flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-tiffany-400 to-tiffany-600"
              style={{ width: `${Math.max(2, p.progresso * 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-700">
            {Math.round(p.progresso * 100)}%
          </span>
        </div>
      </Card>

      {/* 2. Cascata do funil */}
      <Card
        title="Funil — meta vs esperado vs realizado"
        subtitle="Esperado até hoje = meta ÷ dias da campanha × dias decorridos. Custo (CPM/CPL/CAC) é quanto menor melhor."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2 font-medium">Métrica</th>
                <th className="px-3 py-2 text-right font-medium">Meta total</th>
                <th className="px-3 py-2 text-right font-medium">Esperado até hoje</th>
                <th className="px-3 py-2 text-right font-medium">Realizado</th>
                <th className="px-3 py-2 text-right font-medium">% atingimento</th>
                <th className="px-3 py-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map((r) => (
                <Row key={r.key} r={r} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Row({ r }: { r: ProjecaoRow }) {
  const pill = STATUS_PILL[r.status];
  return (
    <tr className="border-b border-zinc-200 hover:bg-zinc-100">
      <td className="px-3 py-3 font-medium text-zinc-900">
        {r.label}
        {r.menorMelhor && <span className="ml-1.5 text-[10px] font-normal text-zinc-400">menor melhor</span>}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{fmt(r.format, r.metaTotal)}</td>
      <td className="px-3 py-3 text-right tabular-nums text-zinc-600">{fmt(r.format, r.esperado)}</td>
      <td className="px-3 py-3 text-right font-semibold tabular-nums text-zinc-900">{fmt(r.format, r.realizado)}</td>
      <td className="px-3 py-3 text-right tabular-nums text-zinc-700">
        {r.score != null ? `${Math.round(r.score * 100)}%` : '—'}
      </td>
      <td className="px-3 py-3 text-right">
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', pill.text)}>
          <span className={cn('h-2 w-2 rounded-full', pill.dot)} />
          {pill.label}
        </span>
      </td>
    </tr>
  );
}
