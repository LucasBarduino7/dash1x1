import {
  AlertTriangle,
  Eye,
  FileText,
  Gauge,
  HandCoins,
  Layers,
  Megaphone,
  Percent,
  ShoppingCart,
  Smartphone,
  Target,
  Ticket,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { fetchWorkshopDashboard } from '@/lib/workshop/dashboard';
import { PERIOD, daysUntil } from '@/lib/workshop/event';
import { computeProjection } from '@/lib/workshop/projection';
import { brl, formatDateBR, num, pct } from '@/lib/shared/format';
import {
  rateCheckoutConv,
  rateConnectRate,
  rateCpm,
  rateCtr,
  rateSalesPageConv,
} from '@/lib/workshop/benchmarks';
import { BarList } from '@/components/workshop/BarList';
import { Card } from '@/components/workshop/Card';
import { Header } from '@/components/workshop/Header';
import { KPI } from '@/components/workshop/KPI';
import { Projection } from '@/components/workshop/Projection';
import { SalesChart } from '@/components/workshop/charts/SalesChart';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NAME_FILTER = process.env.WORKSHOP_CAMPAIGN_FILTER || 'AGÊNCIAIA';

const TIPO_LABEL: Record<'ingresso' | 'orderbump', string> = {
  ingresso: 'Ingresso',
  orderbump: 'Order bump',
};

const PLATFORM_LABEL: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  audience_network: 'Audience Network',
  messenger: 'Messenger',
  unknown: 'Outro',
};
const POSITION_LABEL: Record<string, string> = {
  feed: 'Feed',
  instagram_feed: 'Feed',
  instagram_reels: 'Reels',
  facebook_reels: 'Reels',
  reels: 'Reels',
  instagram_stories: 'Stories',
  story: 'Stories',
  instagram_explore: 'Explore',
  instagram_explore_home: 'Explore',
  instagram_profile_feed: 'Perfil',
};
function placementLabel(key: string): string {
  const [pf, pos] = key.split('/');
  const p = PLATFORM_LABEL[pf] ?? pf;
  const q = POSITION_LABEL[pos] ?? pos.replace(/_/g, ' ');
  return `${p} · ${q}`;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(value: string | undefined): string | null {
  if (!value || !ISO_DATE.test(value)) return null;
  if (value < PERIOD.since || value > PERIOD.until) return null;
  return value;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === 'projecao' ? 'projecao' : 'geral';
  const selectedDay = tab === 'geral' ? parseDay(sp.day) : null;
  const period = selectedDay ? { since: selectedDay, until: selectedDay } : PERIOD;
  const data = await fetchWorkshopDashboard(period);
  const { meta, kiwify, event } = data;
  const daysToEvent = daysUntil(event.start);
  const projection = computeProjection(kiwify.ingressos, meta.summary.spend);

  // Une investimento/dia (Meta) + ingressos/dia (Kiwify)
  const spendByDate = new Map(meta.timeline.map((t) => [t.date, t.spend]));
  const ingByDate = new Map(kiwify.timeline.map((t) => [t.date, t.ingressos]));
  const allDates = Array.from(
    new Set([...spendByDate.keys(), ...ingByDate.keys()]),
  ).sort();
  const chartData = allDates.map((date) => ({
    date,
    spend: spendByDate.get(date) ?? 0,
    ingressos: ingByDate.get(date) ?? 0,
  }));

  const goalHint =
    data.goalTickets > 0
      ? `${pct((kiwify.ingressos / data.goalTickets) * 100, 0)} da meta (${num(data.goalTickets)})`
      : kiwify.ingressos > 0
        ? `${brl(kiwify.faturamentoIngressos)} em ingressos`
        : undefined;

  const recentSales = kiwify.sales.slice(0, 12);

  // Classificação conforme média de mercado
  const s = meta.summary;
  const ctrR = rateCtr(s.ctr);
  const cpmR = rateCpm(s.cpm);
  const connR = rateConnectRate(s.connectRate);
  const pageR = rateSalesPageConv(s.salesPageConv);
  const checkoutR = rateCheckoutConv(s.checkoutConv);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:py-10">
      <Header
        event={event}
        daysToEvent={daysToEvent}
        filter={NAME_FILTER}
        selectedDay={selectedDay}
        periodMin={PERIOD.since}
        periodMax={PERIOD.until}
      />

      <nav className="mb-8 inline-flex rounded-xl border border-[#e3eceb] bg-white p-1 shadow-sm">
        <Link
          href="/workshop?tab=geral"
          className={
            tab === 'geral'
              ? 'rounded-lg bg-[#0abab5] px-4 py-1.5 text-sm font-medium text-white'
              : 'rounded-lg px-4 py-1.5 text-sm font-medium text-[#5b6b69] hover:bg-[#f1f6f5]'
          }
        >
          Visão geral
        </Link>
        <Link
          href="/workshop?tab=projecao"
          className={
            tab === 'projecao'
              ? 'rounded-lg bg-[#0abab5] px-4 py-1.5 text-sm font-medium text-white'
              : 'rounded-lg px-4 py-1.5 text-sm font-medium text-[#5b6b69] hover:bg-[#f1f6f5]'
          }
        >
          Projeção
        </Link>
      </nav>

      {tab === 'projecao' ? (
        <Projection p={projection} />
      ) : (
        <>

      {data.warnings.length > 0 && (
        <div className="mb-6 space-y-2">
          {data.warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Vendas — Kiwify */}
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[#8a9492]">
        Vendas · Kiwify
      </h2>
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
        <KPI
          label="Ingressos vendidos"
          value={num(kiwify.ingressos)}
          hint={goalHint}
          icon={Ticket}
          tone="good"
          size="lg"
        />
        <KPI
          label="Faturamento líquido"
          value={brl(kiwify.faturamentoTotal)}
          hint={`Ingressos ${brl(kiwify.faturamentoIngressos)} · líquido (pós-taxa)`}
          icon={HandCoins}
          tone="brand"
          size="lg"
        />
        <KPI
          label="Order bumps vendidos"
          value={num(kiwify.orderbumps)}
          hint={kiwify.orderbumps > 0 ? brl(kiwify.faturamentoOrderbumps) : 'nenhum ainda'}
          icon={Layers}
          tone="blue"
        />
      </div>

      {/* Tráfego — Meta */}
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[#8a9492]">
        Tráfego · Meta Ads {NAME_FILTER}
      </h2>
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI label="Investimento" value={brl(s.spend)} icon={Wallet} tone="brand" />
        <KPI label="CTR" value={pct(s.ctr)} icon={Percent} tone={ctrR.tone} ratingLabel={ctrR.label} />
        <KPI label="CPM" value={brl(s.cpm)} icon={Gauge} tone={cpmR.tone} ratingLabel={cpmR.label} />
        <KPI
          label="Custo por ingresso"
          value={kiwify.ingressos > 0 ? brl(data.cpa) : '—'}
          hint="investimento / ingressos"
          icon={Target}
          tone="warn"
        />
      </div>

      {/* Funil de conversão — Meta */}
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-[#8a9492]">
        Funil de conversão
      </h2>
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        <KPI
          label="Connect rate"
          value={pct(s.connectRate)}
          hint={`${num(s.landingPageViews)} LP views / ${num(s.linkClicks)} cliques`}
          icon={Eye}
          tone={connR.tone}
          ratingLabel={connR.label}
        />
        <KPI
          label="Conversão da página de vendas"
          value={pct(s.salesPageConv)}
          hint={`${num(s.initiateCheckout)} checkouts / ${num(s.landingPageViews)} LP views`}
          icon={FileText}
          tone={pageR.tone}
          ratingLabel={pageR.label}
        />
        <KPI
          label="Conversão de checkout"
          value={pct(s.checkoutConv)}
          hint={`${num(s.purchases)} compras / ${num(s.initiateCheckout)} checkouts`}
          icon={ShoppingCart}
          tone={checkoutR.tone}
          ratingLabel={checkoutR.label}
        />
      </div>

      {/* Ads que mais vendem + perfil de quem compra */}
      <Card
        title="Ads que mais vendem"
        subtitle="Vendas atribuídas pelo pixel do Meta"
        className="mb-6"
        right={<Megaphone className="h-4 w-4 text-[#0abab5]" />}
      >
        {meta.topAds.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e3eceb] text-left text-xs uppercase tracking-wider text-[#8a9492]">
                  <th className="pb-2 pr-3 font-medium">Anúncio</th>
                  <th className="pb-2 pr-3 text-right font-medium">Vendas</th>
                  <th className="pb-2 pr-3 text-right font-medium">Investido</th>
                  <th className="pb-2 text-right font-medium">Custo/venda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3eceb]">
                {meta.topAds.slice(0, 8).map((a) => (
                  <tr key={a.name} className="text-[#0f1716]">
                    <td className="py-2 pr-3">
                      <span className="block max-w-[260px] truncate">{a.name}</span>
                    </td>
                    <td className="py-2 pr-3 text-right font-semibold tabular-nums text-emerald-700">
                      {num(a.purchases)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{brl(a.spend)}</td>
                    <td className="py-2 text-right tabular-nums">{brl(a.costPerPurchase)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[#8a9492]">
            Sem vendas atribuídas pelo pixel no período.
          </p>
        )}
      </Card>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card
          title="Idade de quem compra"
          subtitle="Compras por faixa etária"
          right={<Users className="h-4 w-4 text-[#0abab5]" />}
        >
          <BarList
            items={meta.salesByAge.map((a) => ({ label: a.age, value: a.purchases }))}
            emptyText="Sem compras atribuídas no período."
          />
        </Card>
        <Card
          title="Posicionamento que mais vende"
          subtitle="Feed, Reels, Stories…"
          right={<Smartphone className="h-4 w-4 text-[#0abab5]" />}
        >
          <BarList
            items={meta.salesByPlacement.map((p) => ({
              label: placementLabel(p.placement),
              value: p.purchases,
            }))}
            emptyText="Sem compras atribuídas no período."
          />
        </Card>
      </div>

      {/* Gráfico */}
      <Card
        title="Ingressos e investimento por dia"
        subtitle={
          selectedDay
            ? `Dia ${formatDateBR(selectedDay)}`
            : `Período ${formatDateBR(data.period.since)} → ${formatDateBR(data.period.until)}`
        }
        className="mb-8"
      >
        {chartData.length > 0 ? (
          <SalesChart data={chartData} />
        ) : (
          <p className="py-12 text-center text-sm text-[#8a9492]">Sem dados no período ainda.</p>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vendas recentes */}
        <Card title="Vendas recentes" subtitle={`${kiwify.sales.length} no período`}>
          {recentSales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e3eceb] text-left text-xs uppercase tracking-wider text-[#8a9492]">
                    <th className="pb-2 pr-3 font-medium">Data</th>
                    <th className="pb-2 pr-3 font-medium">Cliente</th>
                    <th className="pb-2 pr-3 font-medium">Tipo</th>
                    <th className="pb-2 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3eceb]">
                  {recentSales.map((s) => (
                    <tr key={s.id} className="text-[#0f1716]">
                      <td className="py-2 pr-3 tabular-nums text-[#5b6b69]">
                        {s.createdAt ? formatDateBR(s.createdAt) : '—'}
                      </td>
                      <td className="py-2 pr-3">
                        <span className="block truncate">{s.customerName || '—'}</span>
                        <span className="block truncate text-xs text-[#8a9492]">
                          {s.productName}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={
                            s.isOrderBump
                              ? 'rounded-md bg-sky-500/12 px-2 py-0.5 text-xs font-medium text-sky-700'
                              : 'rounded-md bg-emerald-500/12 px-2 py-0.5 text-xs font-medium text-emerald-700'
                          }
                        >
                          {TIPO_LABEL[s.isOrderBump ? 'orderbump' : 'ingresso']}
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums">{brl(s.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[#8a9492]">Nenhuma venda registrada ainda.</p>
          )}
        </Card>

        {/* Campanhas */}
        <Card title="Campanhas" subtitle={`${meta.campaigns.length} ativas no filtro`}>
          {meta.campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e3eceb] text-left text-xs uppercase tracking-wider text-[#8a9492]">
                    <th className="pb-2 pr-3 font-medium">Campanha</th>
                    <th className="pb-2 pr-3 text-right font-medium">Investido</th>
                    <th className="pb-2 pr-3 text-right font-medium">CTR</th>
                    <th className="pb-2 text-right font-medium">CPM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3eceb]">
                  {meta.campaigns.map((c) => (
                    <tr key={c.id} className="text-[#0f1716]">
                      <td className="py-2 pr-3">
                        <span className="block max-w-[220px] truncate">{c.name}</span>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{brl(c.spend)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{pct(c.ctr)}</td>
                      <td className="py-2 text-right tabular-nums">{brl(c.cpm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[#8a9492]">
              Nenhuma campanha {NAME_FILTER} encontrada no período.
            </p>
          )}
        </Card>
      </div>
        </>
      )}
    </main>
  );
}
