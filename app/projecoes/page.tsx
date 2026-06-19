import { CalendarClock, Gauge, HandCoins, Target, TrendingUp, Wallet } from 'lucide-react';
import { brl, num } from '@/lib/shared/format';
import { Card } from '@/components/onex1/Card';
import { KPI } from '@/components/onex1/KPI';
import { getAlavancas, type AlavancasData } from '@/lib/alavancas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const pctFmt = (v: number) => `${Math.round(v * 100)}%`;
const roasFmt = (v: number) => `${v.toFixed(2).replace('.', ',')}×`;

export default async function ProjecoesPage() {
  const d = await getAlavancas();

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:py-10">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-tiffany-500/10 text-tiffany-600">
          <TrendingUp className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Projeções</h1>
          <p className="text-sm text-zinc-500">Metas e alavancas do Scale · {d.mesLabel}</p>
        </div>
      </div>

      {/* Hero — meta consolidada */}
      <Hero d={d} />

      {/* KPIs */}
      <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KPI label="Meta do mês" value={brl(d.totAlav.projetado)} hint="Soma das alavancas" icon={Target} tone="brand" size="lg" />
        <KPI label="Realizado" value={brl(d.totAlav.realizado)} hint={pctFmt(d.pctTotal)} icon={HandCoins} tone="brand" size="lg" />
        <KPI label="Falta" value={brl(d.faltaTotal)} hint="Pra bater a meta" icon={TrendingUp} tone="brand" size="lg" />
        <KPI label="Por dia" value={brl(d.totAlav.porDia)} hint={`${d.diasRestantes} dias restantes`} icon={CalendarClock} tone="brand" size="lg" />
        <KPI label="Mídia" value={brl(d.totAlav.midia)} hint="Investimento total" icon={Wallet} tone="brand" size="lg" />
        <KPI label="ROAS atual" value={d.roasTotal != null ? roasFmt(d.roasTotal) : '—'} hint="Realizado ÷ mídia" icon={Gauge} tone="brand" size="lg" />
      </section>

      {/* Alavancas */}
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">Alavancas</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {d.alavancas.map((a) => (
          <AlavancaCard key={a.nome} a={a} diasRestantes={d.diasRestantes} />
        ))}
      </div>
    </main>
  );
}

function Hero({ d }: { d: AlavancasData }) {
  return (
    <Card className="mb-6 bg-gradient-to-br from-tiffany-500/10 to-transparent">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">Scale · total a faturar</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums text-zinc-900">
            {brl(d.totAlav.realizado)}{' '}
            <span className="text-xl font-medium text-zinc-400">/ {brl(d.totAlav.projetado)}</span>
          </p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-sm text-zinc-500">
            Falta <span className="font-semibold text-zinc-900">{brl(d.faltaTotal)}</span> ·{' '}
            <span className="font-semibold text-tiffany-700">{brl(d.totAlav.porDia)}/dia</span> em{' '}
            {d.diasRestantes} dias
          </p>
        </div>
      </div>
      <div className="mt-4">
        <Bar pct={d.pctTotal} batido={d.totAlav.realizado >= d.totAlav.projetado && d.totAlav.projetado > 0} big />
        <p className="mt-1.5 text-right text-xs font-medium text-zinc-500">{pctFmt(d.pctTotal)} da meta</p>
      </div>
    </Card>
  );
}

function AlavancaCard({
  a,
  diasRestantes,
}: {
  a: AlavancasData['alavancas'][number];
  diasRestantes: number;
}) {
  const semMeta = a.projetado === 0;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-zinc-900">{a.nome}</p>
          {a.auto && (
            <span className="mt-0.5 inline-block rounded bg-tiffany-500/10 px-1.5 py-0.5 text-[10px] font-medium text-tiffany-700">
              ao vivo
            </span>
          )}
        </div>
        <StatusBadge a={a} semMeta={semMeta} />
      </div>

      {!semMeta && (
        <div className="mb-3">
          <Bar pct={a.pct} batido={a.batido} />
          <div className="mt-1.5 flex justify-between text-xs tabular-nums text-zinc-600">
            <span className="font-medium text-zinc-900">{brl(a.realizado)}</span>
            <span className="text-zinc-400">meta {brl(a.projetado)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 text-xs">
        <Mini label="Mídia" value={a.midia > 0 ? brl(a.midia) : '—'} />
        <Mini label="ROAS" value={a.roasAtual != null ? roasFmt(a.roasAtual) : '—'} />
        <Mini
          label="Forecasting"
          value={semMeta ? '—' : a.batido ? '✓ batido' : `${brl(a.porDia)}/dia`}
          accent={!semMeta && !a.batido}
        />
      </div>
    </div>
  );
}

function StatusBadge({ a, semMeta }: { a: AlavancasData['alavancas'][number]; semMeta: boolean }) {
  if (semMeta) {
    return (
      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500">
        sem meta
      </span>
    );
  }
  if (a.batido) {
    return (
      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-500/30">
        ✓ batido
      </span>
    );
  }
  return (
    <span className="rounded-full bg-tiffany-500/15 px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-tiffany-700 ring-1 ring-inset ring-tiffany-500/30">
      {pctFmt(a.pct)}
    </span>
  );
}

function Bar({ pct, batido, big }: { pct: number; batido?: boolean; big?: boolean }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-zinc-100 ${big ? 'h-3' : 'h-2'}`}>
      <div
        className={`h-full rounded-full ${batido ? 'bg-emerald-500' : 'bg-tiffany-500'}`}
        style={{ width: `${Math.max(2, pct * 100)}%` }}
      />
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-400">{label}</p>
      <p className={`mt-0.5 tabular-nums ${accent ? 'font-medium text-tiffany-700' : 'text-zinc-800'}`}>
        {value}
      </p>
    </div>
  );
}
