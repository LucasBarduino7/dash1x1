import { num, pct } from '@/lib/shared/format';

type Stage = {
  label: string;
  value: number;
  /** Cor de preenchimento em hex (sem alpha) */
  fill: string;
};

type Props = {
  stages: Stage[];
  /** Altura de cada etapa em px */
  rowHeight?: number;
};

const MIN_WIDTH_PCT = 14; // largura mínima pra última etapa não sumir

export function FunnelChart({ stages, rowHeight = 90 }: Props) {
  if (stages.length === 0) return null;
  const top = stages[0].value || 1;
  const totalH = stages.length * rowHeight;
  const VBW = 100; // viewBox width
  const VBH = totalH;

  // Calcula a largura proporcional (mas com piso pra não desaparecer)
  const widths = stages.map((s) =>
    Math.max((s.value / top) * VBW, MIN_WIDTH_PCT),
  );

  return (
    <div className="relative w-full" style={{ height: `${totalH}px` }}>
      <svg
        viewBox={`0 0 ${VBW} ${VBH}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          {stages.map((s, i) => (
            <linearGradient key={i} id={`fg${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.fill} stopOpacity="0.7" />
              <stop offset="100%" stopColor={s.fill} stopOpacity="0.4" />
            </linearGradient>
          ))}
        </defs>
        {stages.map((s, i) => {
          const wTop = i === 0 ? VBW : widths[i - 1];
          const wBot = widths[i];
          const y0 = i * rowHeight;
          const y1 = (i + 1) * rowHeight;
          const xTopL = (VBW - wTop) / 2;
          const xTopR = (VBW + wTop) / 2;
          const xBotL = (VBW - wBot) / 2;
          const xBotR = (VBW + wBot) / 2;
          return (
            <polygon
              key={i}
              points={`${xTopL},${y0} ${xTopR},${y0} ${xBotR},${y1} ${xBotL},${y1}`}
              fill={`url(#fg${i})`}
              stroke={s.fill}
              strokeWidth="0.25"
              strokeOpacity="0.6"
            />
          );
        })}
      </svg>

      {/* Labels sobrepostos */}
      {stages.map((s, i) => {
        const pctOfTop = (s.value / top) * 100;
        const prev = i > 0 ? stages[i - 1].value : null;
        const pctOfPrev = prev && prev > 0 ? (s.value / prev) * 100 : null;
        return (
          <div
            key={i}
            className="absolute left-0 right-0 flex items-center justify-between px-6"
            style={{
              top: `${i * rowHeight}px`,
              height: `${rowHeight}px`,
            }}
          >
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-800">
                {s.label}
              </p>
              {pctOfPrev !== null && (
                <p className="mt-0.5 text-[11px] text-zinc-600">
                  {pct(pctOfPrev)} da etapa anterior
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums leading-none text-zinc-900">
                {num(s.value)}
              </p>
              <p className="mt-1 text-[11px] tabular-nums text-zinc-600">
                {pct(pctOfTop)} do topo
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
