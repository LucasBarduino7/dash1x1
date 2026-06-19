import { TrendingUp } from 'lucide-react';
import { brl } from '@/lib/shared/format';
import { PageBanner } from '@/components/shared/PageBanner';
import { getAlavancas, type AlavancasData } from '@/lib/alavancas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const pctFmt = (v: number) => `${Math.round(v * 100)}%`;
const roasFmt = (v: number) => `${v.toFixed(2).replace('.', ',')}×`;

export default async function ProjecoesPage() {
  const d = await getAlavancas();

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:py-10">
      <PageBanner src="/banner-projecoes.png" alt="Alavancas · Grupo Scale" />

      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-tiffany-500/10 text-tiffany-600">
          <TrendingUp className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Alavancas</h1>
          <p className="text-sm text-zinc-500">Metas e projeções do Scale · {d.mesLabel}</p>
        </div>
      </div>

      {/* Resumo enxuto */}
      <div className="mb-6 flex flex-wrap items-center gap-x-10 gap-y-3 rounded-2xl border border-zinc-200 bg-gradient-to-br from-tiffany-500/10 to-transparent p-5">
        <Stat label="Meta do mês" value={brl(d.totAlav.projetado)} />
        <Stat label="Realizado" value={`${brl(d.totAlav.realizado)}`} sub={pctFmt(d.pctTotal)} />
        <Stat label="Falta" value={brl(d.faltaTotal)} />
        <Stat label="Por dia" value={`${brl(d.totAlav.porDia)}`} sub={`${d.diasRestantes} dias`} accent />
        <Stat label="ROAS atual" value={d.roasTotal != null ? roasFmt(d.roasTotal) : '—'} />
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-medium">Alavanca</th>
              <th className="px-4 py-3 text-right font-medium">Projetado</th>
              <th className="px-4 py-3 text-right font-medium">Mídia</th>
              <th className="px-4 py-3 text-right font-medium">ROAS</th>
              <th className="px-4 py-3 text-right font-medium">Realizado</th>
              <th className="px-4 py-3 text-right font-medium">Forecasting</th>
            </tr>
          </thead>
          <tbody>
            {d.alavancas.map((a) => (
              <tr key={a.nome} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900">{a.nome}</span>
                    {a.auto && (
                      <span className="rounded bg-tiffany-500/10 px-1.5 py-0.5 text-[10px] font-medium text-tiffany-700">
                        ao vivo
                      </span>
                    )}
                  </div>
                  {a.projetado > 0 && (
                    <div className="mt-1.5 h-1.5 w-40 max-w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full ${a.batido ? 'bg-emerald-500' : 'bg-tiffany-500'}`}
                        style={{ width: `${Math.max(2, a.pct * 100)}%` }}
                      />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-700">
                  {a.projetado > 0 ? brl(a.projetado) : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-700">
                  {a.midia > 0 ? brl(a.midia) : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-500">
                  {a.roasAtual != null ? roasFmt(a.roasAtual) : '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-zinc-900">
                  {brl(a.realizado)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {a.projetado === 0 ? (
                    <span className="text-zinc-300">—</span>
                  ) : a.batido ? (
                    <span className="font-medium text-emerald-600">✓ batido</span>
                  ) : (
                    <span className="font-medium text-tiffany-700">{brl(a.porDia)}/dia</span>
                  )}
                </td>
              </tr>
            ))}
            <tr className="bg-tiffany-500/[0.07]">
              <td className="px-4 py-3 font-semibold text-zinc-900">Scale · total</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-zinc-900">{brl(d.totAlav.projetado)}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-zinc-900">{brl(d.totAlav.midia)}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-zinc-500">
                {d.roasTotal != null ? roasFmt(d.roasTotal) : '—'}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-zinc-900">{brl(d.totAlav.realizado)}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-tiffany-700">
                {d.totAlav.porDia > 0 ? `${brl(d.totAlav.porDia)}/dia` : '✓ batido'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Forecasting = (Projetado − Realizado) ÷ {d.diasRestantes} dias restantes — quanto precisa
        entrar por dia pra bater a meta. Realizado de 1x1, Social Selling e Workshop vem ao vivo dos
        dashboards.
      </p>
    </main>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-2xl font-semibold tabular-nums ${accent ? 'text-tiffany-700' : 'text-zinc-900'}`}>
        {value}
        {sub && <span className="ml-1.5 text-xs font-medium text-zinc-400">{sub}</span>}
      </p>
    </div>
  );
}
