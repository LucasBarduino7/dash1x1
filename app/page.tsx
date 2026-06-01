import {
  AlertTriangle,
  CalendarCheck,
  Eye,
  Gauge,
  HandCoins,
  Layers,
  Percent,
  ReceiptText,
  ShoppingBag,
  Target,
  UserCheck,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { fetchDashboardData } from '@/lib/dashboard';
import { MONTHS, getMonth } from '@/lib/months';
import { brl, num, pct } from '@/lib/format';
import { BuyersTable } from '@/components/BuyersTable';
import { Card } from '@/components/Card';
import { CampaignsTable } from '@/components/CampaignsTable';
import { FunnelChart } from '@/components/FunnelChart';
import { Header } from '@/components/Header';
import { KPI } from '@/components/KPI';
import { RankedTable } from '@/components/RankedTable';
import { Sidebar } from '@/components/Sidebar';
import { TABS, type TabKey } from '@/lib/tabs';
import { AgeChart } from '@/components/charts/AgeChart';
import { AgeQualifChart } from '@/components/charts/AgeQualifChart';
import { QualificationDonut } from '@/components/charts/QualificationDonut';
import { TimelineChart } from '@/components/charts/TimelineChart';
import type { DashboardData } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NAME_FILTER = process.env.META_CAMPAIGN_FILTER || '[1X1]';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_TABS = new Set<TabKey>(TABS.map((t) => t.key));

function clampToMonth(
  date: string | undefined,
  fallback: string,
  bounds: { since: string; until: string },
): string {
  if (!date || !ISO_DATE.test(date)) return fallback;
  if (date < bounds.since) return bounds.since;
  if (date > bounds.until) return bounds.until;
  return date;
}

function parseTab(value: string | undefined): TabKey {
  if (value && VALID_TABS.has(value as TabKey)) return value as TabKey;
  return 'principais';
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ since?: string; until?: string; tab?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const month = getMonth(sp.month);
  const bounds = { since: month.since, until: month.until };
  const since = clampToMonth(sp.since, month.since, bounds);
  const untilRaw = clampToMonth(sp.until, month.until, bounds);
  const until = untilRaw >= since ? untilRaw : since;
  const tab = parseTab(sp.tab);

  let data;
  let error: string | null = null;
  try {
    data = await fetchDashboardData(month, { since, until });
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6">
          <h1 className="text-lg font-semibold text-rose-200">Falha ao carregar o dashboard</h1>
          <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-rose-200/80">
            {error}
          </pre>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:py-10">
      <Header
        period={data.period}
        activeMonth={data.activeMonth}
        filter={NAME_FILTER}
        months={MONTHS.map((m) => ({ key: m.key, label: m.label }))}
        activeMonthKey={month.key}
      />

      {data.warnings.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div className="space-y-1 text-xs text-amber-200/90">
              {data.warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Sidebar active={tab} />
        <div className="min-w-0 flex-1">
          {tab === 'principais' && <SectionPrincipais data={data} />}
          {tab === 'funis' && <SectionFunis data={data} />}
          {tab === 'secundarias' && <SectionSecundarias data={data} />}
          {tab === 'campanhas' && <SectionCampanhas data={data} />}
        </div>
      </div>

      <footer className="mt-10 border-t border-zinc-900 pt-6 text-center text-xs text-zinc-500">
        Dashboard apenas para leitura. Nenhuma alteração é feita em campanhas/conjuntos/anúncios do Meta Ads.
      </footer>
    </main>
  );
}

// ---------- Seções ----------

function SectionPrincipais({ data }: { data: DashboardData }) {
  const taxaComparecimento =
    data.leads.agendados > 0
      ? (data.sales.reunioesRealizadas / data.leads.agendados) * 100
      : 0;
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI
          label="Donos de agência"
          value={num(data.leads.qualificados)}
          hint={`${pct(data.leads.taxaQualificacao)} dos ${num(data.leads.total)} leads`}
          tone="warn"
          icon={UserCheck}
          size="lg"
        />
        <KPI
          label="Reuniões realizadas"
          value={num(data.sales.reunioesRealizadas)}
          hint={`${num(data.leads.agendados)} agendadas no mês`}
          tone="good"
          icon={CalendarCheck}
          size="lg"
        />
        <KPI
          label="Custo por dono de agência"
          value={brl(data.qualif.custoPorLeadQualificado)}
          hint={`${brl(data.meta.spendTotal)} ÷ ${num(data.leads.qualificados)}`}
          tone="brand"
          icon={Target}
          size="lg"
        />
        <KPI
          label="Custo por call realizada"
          value={brl(data.sales.custoPorRealizada)}
          hint={`${brl(data.meta.spendTotal)} ÷ ${num(data.sales.reunioesRealizadas)} realizadas`}
          tone="brand"
          icon={Zap}
          size="lg"
        />
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KPI label="Investimento" value={brl(data.meta.spendTotal)} icon={Wallet} tone="brand" />
        <KPI
          label="Connect rate"
          value={pct(data.meta.connectRate)}
          hint="LP views / cliques"
          icon={Eye}
          tone={
            data.meta.connectRate >= 70 ? 'good' : data.meta.connectRate >= 50 ? 'warn' : 'bad'
          }
        />
        <KPI
          label="Taxa de comparecimento"
          value={pct(taxaComparecimento)}
          hint={`${num(data.sales.reunioesRealizadas)} realizadas / ${num(data.leads.agendados)} agendadas`}
          icon={CalendarCheck}
          tone={
            taxaComparecimento >= 70 ? 'good' : taxaComparecimento >= 50 ? 'warn' : 'bad'
          }
        />
        <KPI
          label="Taxa de conversão"
          value={pct(data.sales.taxaConversao)}
          hint={`${num(data.sales.totalVendas)} vendas / ${num(data.sales.reunioesRealizadas)} realizadas`}
          icon={Percent}
          tone={data.sales.taxaConversao >= 40 ? 'good' : data.sales.taxaConversao >= 20 ? 'warn' : 'bad'}
        />
        <KPI
          label="Leads (Meta)"
          value={num(data.meta.leadsMeta)}
          hint="Vol. registrado pelo pixel"
          icon={Users}
        />
        <KPI
          label="CPL (Meta)"
          value={brl(data.meta.cplMeta)}
          hint="Custo por lead bruto"
          icon={Target}
        />
      </section>

      <section>
        <Card
          title="Vendas e CAC"
          subtitle="Faturamento gerado a partir das campanhas [1X1] no mês. Match dos compradores apenas contra a planilha de origem (1x1)."
          right={
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200">
              <ShoppingBag className="h-3.5 w-3.5" />
              {data.sales.totalVendas} de {data.sales.buyers.length} compradores são 1x1
            </span>
          }
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <KPI
              label="Vendas 1x1"
              value={num(data.sales.totalVendas)}
              hint={`de ${data.sales.buyers.length} compradores no mês`}
              icon={ShoppingBag}
              tone="good"
              size="lg"
            />
            <KPI
              label="Taxa de conversão"
              value={pct(data.sales.taxaConversao)}
              hint={`${num(data.sales.totalVendas)} vendas ÷ ${num(data.sales.reunioesRealizadas)} calls realizadas`}
              icon={Percent}
              tone={data.sales.taxaConversao >= 40 ? 'good' : data.sales.taxaConversao >= 20 ? 'warn' : 'bad'}
              size="lg"
            />
            <KPI
              label="Faturamento"
              value={brl(data.sales.faturamento1x1)}
              hint="entrada + parcelas no mês"
              icon={HandCoins}
              tone="good"
              size="lg"
            />
            <KPI
              label="Ticket médio"
              value={brl(data.sales.ticketMedio)}
              icon={ReceiptText}
              tone="brand"
              size="lg"
            />
            <KPI
              label="CAC"
              value={brl(data.sales.cac)}
              hint={`${brl(data.meta.spendTotal)} ÷ ${data.sales.totalVendas} vendas`}
              icon={Target}
              tone="brand"
              size="lg"
            />
            <KPI
              label="ROAS"
              value={`${data.sales.roas.toFixed(2).replace('.', ',')}×`}
              hint={`R$ ${data.sales.roas.toFixed(2).replace('.', ',')} retorno por R$ 1 investido`}
              icon={Gauge}
              tone={data.sales.roas >= 2 ? 'good' : data.sales.roas >= 1 ? 'warn' : 'bad'}
              size="lg"
            />
          </div>

          <div className="mt-5">
            <h3 className="mb-3 text-sm font-medium text-zinc-200">Compradores do mês</h3>
            <BuyersTable buyers={data.sales.buyers} />
          </div>
        </Card>
      </section>
    </div>
  );
}

function SectionFunis({ data }: { data: DashboardData }) {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Funil geral" subtitle="Todos os leads do mês até a venda fechada">
        <FunnelChart
          stages={[
            { label: 'Leads totais', value: data.leads.total, fill: '#71717a' },
            { label: 'Agendamentos', value: data.leads.agendados, fill: '#8b5cf6' },
            { label: 'Comparecimentos', value: data.sales.reunioesRealizadas, fill: '#0ea5e9' },
            { label: 'Vendas 1x1', value: data.sales.totalVendas, fill: '#10b981' },
          ]}
        />
      </Card>
      <Card
        title="Funil de qualificados"
        subtitle="Apenas donos de agência — desconsidera o filtro de qualificação"
      >
        <FunnelChart
          stages={[
            { label: 'Donos de agência', value: data.leads.qualificados, fill: '#f59e0b' },
            { label: 'Agendamentos', value: data.leads.agendados, fill: '#8b5cf6' },
            { label: 'Comparecimentos', value: data.sales.reunioesRealizadas, fill: '#0ea5e9' },
            { label: 'Vendas 1x1', value: data.sales.totalVendas, fill: '#10b981' },
          ]}
        />
      </Card>
    </section>
  );
}

function SectionSecundarias({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Investimento e leads por dia"
          subtitle="Volume diário ao longo do período"
        >
          <TimelineChart data={data.dailyTimeline} />
        </Card>
        <Card title="Qualificação dos leads" subtitle="Status real (cor da planilha)">
          <QualificationDonut stats={data.leads} />
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Leads por idade" subtitle="Volume total de leads (Meta) por faixa etária">
          {data.ageBreakdown.length > 0 ? (
            <AgeChart data={data.ageBreakdown} />
          ) : (
            <p className="py-12 text-center text-sm text-zinc-500">Sem dados de idade.</p>
          )}
        </Card>
        <Card
          title="Donos de agência por idade"
          subtitle="Estimativa: idade ponderada pela taxa de qualificação de cada conjunto"
        >
          {data.qualifiedAgeBreakdown.length > 0 ? (
            <AgeQualifChart data={data.qualifiedAgeBreakdown} />
          ) : (
            <p className="py-12 text-center text-sm text-zinc-500">Sem dados pra estimar.</p>
          )}
        </Card>
      </section>
    </div>
  );
}

function SectionCampanhas({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4">
      <Card
        title="Campanhas no período"
        subtitle="Métricas brutas do Meta (sem cruzamento com planilha)."
      >
        <CampaignsTable rows={data.campaigns} />
      </Card>

      <Card
        title="Ranking de Conjuntos"
        subtitle="Ordenado por nº de donos de agência (amarelo + verde + roxo). Cruzamento por adset_id entre planilha automatizada (origem) e planilha colorida (qualificação)."
        right={
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-[11px] text-violet-200">
            <Layers className="h-3.5 w-3.5" />
            {data.adsetsRanked.length} conjuntos
          </span>
        }
      >
        <RankedTable rows={data.adsetsRanked} entityLabel="Conjunto" limit={40} />
      </Card>

      <Card
        title="Ranking de Anúncios"
        subtitle="Ordenado por nº de donos de agência (amarelo + verde + roxo). Cruzamento por ad_id — só aparece se a planilha de origem trouxer o ID do anúncio."
        right={
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-[11px] text-violet-200">
            <Layers className="h-3.5 w-3.5" />
            {data.adsRanked.length} anúncios
          </span>
        }
      >
        <RankedTable rows={data.adsRanked} entityLabel="Anúncio" limit={40} />
      </Card>
    </div>
  );
}
