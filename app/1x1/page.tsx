import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  CalendarClock,
  Eye,
  Gauge,
  HandCoins,
  Percent,
  ReceiptText,
  ShoppingBag,
  Target,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { fetchDashboardData } from '@/lib/onex1/dashboard';
import { MONTHS, getMonth } from '@/lib/onex1/months';
import { brl, num, pct } from '@/lib/shared/format';
import { BuyersTable } from '@/components/onex1/BuyersTable';
import { Card } from '@/components/onex1/Card';
import { Header } from '@/components/onex1/Header';
import { KPI } from '@/components/onex1/KPI';
import { LeadScoreTable, notaComprador } from '@/components/onex1/LeadScoreTable';
import { Sidebar } from '@/components/onex1/Sidebar';
import { TABS, type TabKey } from '@/lib/onex1/tabs';
import type { DashboardData } from '@/lib/onex1/types';

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
          {tab === 'secundarias' && <SectionSecundarias data={data} />}
          {tab === 'leadscore' && <SectionLeadScore data={data} />}
        </div>
      </div>

      <footer className="mt-10 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-500">
        Dashboard apenas para leitura. Nenhuma alteração é feita em campanhas/conjuntos/anúncios do Meta Ads.
      </footer>
    </main>
  );
}

// ---------- Métricas Principais ----------

function SectionPrincipais({ data }: { data: DashboardData }) {
  const leads = data.meta.leadsMeta;
  const agendamentos = data.leads.agendados;
  const realizadas = data.sales.reunioesRealizadas;
  const vendas = data.sales.totalVendas;

  // Todas as taxas calculadas sobre o total de Leads (pixel do Meta).
  const taxaSobreLeads = (n: number) => (leads > 0 ? (n / leads) * 100 : 0);
  const taxaAgendamentos = taxaSobreLeads(agendamentos);
  const taxaRealizadas = taxaSobreLeads(realizadas);
  const taxaConversao = taxaSobreLeads(vendas);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KPI
          label="Leads"
          value={num(leads)}
          hint="Volume registrado pelo pixel (Meta)"
          icon={Users}
          tone="brand"
          size="lg"
        />
        <KPI
          label="CPL"
          value={brl(data.meta.cplMeta)}
          hint="Custo por lead bruto"
          icon={Target}
          tone="brand"
          size="lg"
        />
        <KPI
          label="Agendamentos"
          value={num(agendamentos)}
          hint={`${pct(taxaAgendamentos)} dos leads`}
          icon={CalendarCheck}
          tone="brand"
          size="lg"
        />
        <KPI
          label="Realizadas"
          value={num(realizadas)}
          hint={`${pct(taxaRealizadas)} dos leads`}
          icon={CalendarCheck}
          tone="brand"
          size="lg"
        />
        <KPI
          label="Vendas"
          value={num(vendas)}
          hint={`${pct(taxaConversao)} de conversão`}
          icon={ShoppingBag}
          tone="brand"
          size="lg"
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
              label="Faturamento"
              value={brl(data.sales.faturamento1x1)}
              hint="entrada + parcelas no mês"
              icon={HandCoins}
              tone="brand"
              size="lg"
            />
            <KPI
              label="Pós Cash"
              value={brl(data.sales.posCash)}
              hint="Parcelas futuras a receber"
              icon={CalendarClock}
              tone="brand"
              size="lg"
            />
            <KPI
              label="Investimento"
              value={brl(data.meta.spendTotal)}
              hint="Total gasto no mês (Meta)"
              icon={Wallet}
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
              label="Taxa de conversão"
              value={pct(taxaConversao)}
              hint={`${num(vendas)} vendas ÷ ${num(leads)} leads`}
              icon={Percent}
              tone="brand"
              size="lg"
            />
            <KPI
              label="ROAS"
              value={`${data.sales.roas.toFixed(2).replace('.', ',')}×`}
              hint={`R$ ${data.sales.roas.toFixed(2).replace('.', ',')} retorno por R$ 1 investido`}
              icon={Gauge}
              tone="brand"
              size="lg"
            />
          </div>

          <div className="mt-5">
            <h3 className="mb-3 text-sm font-medium text-zinc-800">Compradores do mês</h3>
            <BuyersTable buyers={data.sales.buyers} />
          </div>
        </Card>
      </section>
    </div>
  );
}

// ---------- Métricas Secundárias ----------

function SectionSecundarias({ data }: { data: DashboardData }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      <KPI
        label="CPM"
        value={brl(data.meta.cpm)}
        hint="Custo por mil impressões"
        icon={Wallet}
        tone="brand"
        size="lg"
      />
      <KPI
        label="Connect rate"
        value="—"
        hint="Página de conversão (sem uso)"
        icon={Eye}
        tone="brand"
        size="lg"
      />
      <KPI
        label="CTR"
        value={pct(data.meta.ctr)}
        hint="Cliques / impressões"
        icon={BarChart3}
        tone="brand"
        size="lg"
      />
      <KPI
        label="Ticket médio"
        value={brl(data.sales.ticketMedio)}
        hint="Faturamento ÷ vendas"
        icon={ReceiptText}
        tone="brand"
        size="lg"
      />
      <KPI
        label="Custo por reunião realizada"
        value={brl(data.sales.custoPorRealizada)}
        hint={`${brl(data.meta.spendTotal)} ÷ ${num(data.sales.reunioesRealizadas)} realizadas`}
        icon={CalendarCheck}
        tone="brand"
        size="lg"
      />
      <KPI
        label="Custo por dono de agência"
        value={brl(data.qualif.custoPorLeadQualificado)}
        hint={`${brl(data.meta.spendTotal)} ÷ ${num(data.leads.qualificados)}`}
        icon={Target}
        tone="brand"
        size="lg"
      />
      <KPI
        label="Donos de agência"
        value={num(data.leads.qualificados)}
        hint={`${pct(data.leads.taxaQualificacao)} dos ${num(data.leads.total)} leads`}
        icon={UserCheck}
        tone="brand"
        size="lg"
      />
    </section>
  );
}

// ---------- Lead Score ----------

function SectionLeadScore({ data }: { data: DashboardData }) {
  const compradores = data.sales.buyers.filter((b) => b.is1x1);
  const notas = compradores
    .map((b) => notaComprador(b).nota)
    .filter((n): n is number => n != null);
  const notaMedia = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI
          label="Compradores 1x1"
          value={num(compradores.length)}
          hint={`${num(notas.length)} com nota calculada`}
          icon={ShoppingBag}
          tone="brand"
          size="lg"
        />
        <KPI
          label="Nota média"
          value={notas.length > 0 ? `${notaMedia.toFixed(1).replace('.', ',')} / 10` : '—'}
          hint="Média da nota dos compradores"
          icon={Gauge}
          tone="brand"
          size="lg"
        />
      </section>

      <Card
        title="Lead Score dos compradores"
        subtitle="Nota de 0 a 10 = pago ÷ valor cheio do produto, ajustado pelo faturamento do cliente. Pagar o produto cheio à vista = 10 (faturamento ≥ 150k = 8). Club com entrada ≥ R$ 20k tem piso de 7."
      >
        <LeadScoreTable buyers={compradores} />
      </Card>
    </div>
  );
}
