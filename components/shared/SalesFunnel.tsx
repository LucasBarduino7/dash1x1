import { num, pct } from '@/lib/shared/format';

export type FunnelStage = {
  label: string;
  valor: number;
  /** Rótulo da taxa em relação à etapa anterior (ex: "agendamento", "conversão"). */
  stepLabel?: string;
};

// Larguras decrescentes pra dar o formato de funil (visual; números são exatos).
const WIDTHS = [100, 75, 52, 34, 24, 18];

export function SalesFunnel({ stages, topLabel = 'do topo' }: { stages: FunnelStage[]; topLabel?: string }) {
  const top = stages[0]?.valor ?? 0;
  const rate = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);

  return (
    <div className="py-2">
      {stages.map((s, i) => (
        <div key={s.label}>
          {i > 0 && (
            <div className="flex items-center justify-center py-2">
              <span className="rounded-full bg-tiffany-500/10 px-3 py-1 text-xs font-medium text-tiffany-700">
                ↓ {pct(rate(s.valor, stages[i - 1].valor))}
                {s.stepLabel ? ` de ${s.stepLabel}` : ''}
              </span>
            </div>
          )}
          <div
            className="mx-auto flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-tiffany-500/25 to-tiffany-500/10 px-5 py-4 ring-1 ring-inset ring-tiffany-500/30"
            style={{ width: `${WIDTHS[i] ?? 18}%` }}
          >
            <span className="text-sm font-medium text-zinc-800">{s.label}</span>
            <span className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="text-2xl font-semibold tabular-nums text-zinc-900">{num(s.valor)}</span>
              <span className="text-xs text-zinc-500">
                {pct(rate(s.valor, top))} {topLabel}
              </span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
