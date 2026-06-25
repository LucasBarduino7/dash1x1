import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Eye,
  Gauge,
  HandCoins,
  Megaphone,
  MousePointerClick,
  Percent,
  ReceiptText,
  ShoppingBag,
  Target,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { brl, formatDateBR, num, pct } from '@/lib/shared/format';
import { KPI } from '@/components/onex1/KPI';
import { Card } from '@/components/onex1/Card';
import { Sidebar, type EventoTab } from '@/components/evento/Sidebar';
import { PageBanner } from '@/components/shared/PageBanner';
import { SalesFunnel } from '@/components/shared/SalesFunnel';
import { ProjecaoSection } from '@/components/evento/ProjecaoSection';
import { EVENTO } from '@/data/evento';
import { getEventoMetrics } from '@/lib/evento/metrics';
import { getProjecao } from '@/lib/evento/projecao';
import { fetchEventoMeta, type EventoMeta } from '@/lib/evento/meta';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EventoPresencialPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const VALID: EventoTab[] = ['principais', 'projecao', 'funil', 'midia', 'gastos', 'compradores'];
  const tab: EventoTab = VALID.includes(sp.tab as EventoTab) ? (sp.tab as EventoTab) : 'principais';
  const m = getEventoMetrics();
  // Métricas de mídia (Meta API) entram na aba de mídia e na projeção (CPM/CTR/CPL realizados).
  const meta = tab === 'midia' || tab === 'projecao' ? await fetchEventoMeta() : null;
  const projecao = tab === 'projecao' ? getProjecao(meta) : null;

  const semDados =
    EVENTO.gastos.length === 0 &&
    EVENTO.compradoresAnuncio.length === 0 &&
    EVENTO.convidadosExpansao.length === 0;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:py-10">
      <PageBanner src="/banner-evento.png" alt="Evento Presencial · Grupo Scale" />

      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-tiffany-500/10 text-tiffany-600">
          <CalendarDays className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Evento Presencial</h1>
          <p className="text-sm text-zinc-500">
            Gastos, vendas de ingressos e presença{EVENTO.data ? ` · ${formatDateBR(EVENTO.data)}` : ''}
          </p>
        </div>
      </div>

      {semDados && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Estrutura pronta, aguardando dados/integração — preencha em{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">data/evento.ts</code> (gastos,
          compradores por anúncio e convidados pela expansão).
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Sidebar active={tab} />
        <div className="min-w-0 flex-1">
          {tab === 'principais' && <SectionPrincipais m={m} />}
          {tab === 'projecao' && projecao && <ProjecaoSection p={projecao} />}
          {tab === 'funil' && <SectionFunil m={m} />}
          {tab === 'midia' && meta && <SectionMidia meta={meta} />}
          {tab === 'gastos' && <SectionGastos m={m} />}
          {tab === 'compradores' && <SectionCompradores m={m} />}
        </div>
      </div>
    </main>
  );
}

type Metrics = ReturnType<typeof getEventoMetrics>;

// ---------- Métricas Principais ----------

function SectionPrincipais({ m }: { m: Metrics }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      <KPI label="Gastos do evento" value={brl(m.gastoTotal)} hint="Investimento total" icon={Wallet} tone="brand" size="lg" />
      <KPI label="Vendas (ingressos)" value={num(m.vendas)} hint="Compradores por anúncio" icon={ShoppingBag} tone="brand" size="lg" />
      <KPI label="Faturamento" value={brl(m.faturamento)} hint="Ingressos vendidos" icon={HandCoins} tone="brand" size="lg" />
      <KPI
        label="Pessoas no evento"
        value={num(m.totalPessoas)}
        hint={`${num(m.vendas)} compradores + ${num(m.convidados)} convidados`}
        icon={Users}
        tone="brand"
        size="lg"
      />
      <KPI label="Ticket médio" value={m.vendas > 0 ? brl(m.ticketMedio) : '—'} hint="Faturamento ÷ vendas" icon={ReceiptText} tone="brand" size="lg" />
      <KPI label="CPA" value={m.vendas > 0 ? brl(m.cpa) : '—'} hint="Gasto ÷ compradores" icon={Target} tone="brand" size="lg" />
      <KPI
        label="ROAS"
        value={m.gastoTotal > 0 ? `${m.roas.toFixed(2).replace('.', ',')}×` : '—'}
        hint="Faturamento ÷ gastos"
        icon={Gauge}
        tone="brand"
        size="lg"
      />
    </section>
  );
}

// ---------- Funil de Vendas ----------

function SectionFunil({ m }: { m: Metrics }) {
  return (
    <Card
      title="Funil de vendas"
      subtitle="Reuniões agendadas a partir do evento, igual ao 1x1 — quantidades e taxas entre etapas."
    >
      <SalesFunnel
        topLabel="das pessoas"
        stages={[
          { label: 'Pessoas no evento', valor: m.totalPessoas },
          { label: 'Agendamentos', valor: m.funil.agendamentos, stepLabel: 'agendamento' },
          { label: 'Reuniões realizadas', valor: m.funil.realizadas, stepLabel: 'comparecimento' },
          { label: 'Vendas', valor: m.funil.vendas, stepLabel: 'conversão' },
        ]}
      />
    </Card>
  );
}

// ---------- Métricas de mídia (Meta Ads) ----------

function SectionMidia({ meta }: { meta: EventoMeta }) {
  return (
    <div className="space-y-6">
      {!meta.hasData && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {meta.configured
              ? `Aguardando a campanha do evento (filtro "${meta.filter}"). Assim que ativar amanhã, os números preenchem sozinhos — ou ajuste o filtro na env EVENTO_CAMPAIGN_FILTER.`
              : meta.warning}
          </span>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <KPI label="Investimento" value={brl(meta.spend)} hint="Total gasto (Meta)" icon={Wallet} tone="brand" size="lg" />
        <KPI label="CPM" value={meta.impressions > 0 ? brl(meta.cpm) : '—'} hint="Custo por mil impressões" icon={BarChart3} tone="brand" size="lg" />
        <KPI label="CTR" value={meta.impressions > 0 ? pct(meta.ctr) : '—'} hint="Cliques / impressões" icon={MousePointerClick} tone="brand" size="lg" />
        <KPI label="Connect rate" value={meta.linkClicks > 0 ? pct(meta.connectRate) : '—'} hint="LP views / cliques" icon={Eye} tone="brand" size="lg" />
        <KPI label="CPL" value={meta.leads > 0 ? brl(meta.cpl) : '—'} hint="Custo por lead" icon={Target} tone="brand" size="lg" />
        <KPI label="Leads" value={num(meta.leads)} hint="Registrados pela campanha" icon={Users} tone="brand" size="lg" />
        <KPI label="CPC" value={meta.clicks > 0 ? brl(meta.cpc) : '—'} hint="Custo por clique" icon={Percent} tone="brand" size="lg" />
        <KPI label="Cliques no link" value={num(meta.linkClicks)} hint="Inline link clicks" icon={MousePointerClick} tone="brand" size="lg" />
      </section>
    </div>
  );
}

// ---------- Gastos ----------

function SectionGastos({ m }: { m: Metrics }) {
  return (
    <Card title="Gastos do evento" subtitle="Tudo que está sendo investido no evento presencial.">
      {EVENTO.gastos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
          Nenhum gasto cadastrado — preencha em <code>data/evento.ts</code>.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2 font-medium">Gasto</th>
                <th className="px-3 py-2 font-medium">Categoria</th>
                <th className="px-3 py-2 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {EVENTO.gastos.map((g, i) => (
                <tr key={i} className="border-b border-zinc-200 hover:bg-zinc-100">
                  <td className="px-3 py-3 font-medium text-zinc-900">{g.nome}</td>
                  <td className="px-3 py-3 text-xs text-zinc-600">{g.categoria || '—'}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-900">{brl(g.valor)}</td>
                </tr>
              ))}
              <tr className="bg-tiffany-500/5">
                <td className="px-3 py-3 font-semibold text-zinc-900" colSpan={2}>
                  Total
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-tiffany-700">
                  {brl(m.gastoTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ---------- Compradores ----------

function SectionCompradores({ m }: { m: Metrics }) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KPI label="Compradores (anúncio)" value={num(m.vendas)} hint="Contam como venda" icon={Megaphone} tone="brand" size="lg" />
        <KPI label="Convidados (expansão)" value={num(m.convidados)} hint="Só presença, sem venda" icon={UserPlus} tone="brand" size="lg" />
        <KPI label="Total de pessoas" value={num(m.totalPessoas)} hint="Compradores + convidados" icon={Users} tone="brand" size="lg" />
      </section>

      <Card
        title="Compradores por anúncio"
        subtitle="Vieram de anúncio e compraram ingresso — contam como venda/faturamento."
      >
        {EVENTO.compradoresAnuncio.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
            Nenhum comprador — será automatizado (anúncios). Por ora, preencha em <code>data/evento.ts</code>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-3 py-2 font-medium">Nome</th>
                  <th className="px-3 py-2 font-medium">Anúncio</th>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 text-right font-medium">Ingresso</th>
                </tr>
              </thead>
              <tbody>
                {EVENTO.compradoresAnuncio.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-200 hover:bg-zinc-100">
                    <td className="px-3 py-3 font-medium text-zinc-900">{c.nome}</td>
                    <td className="px-3 py-3 text-xs text-zinc-600">{c.anuncio || '—'}</td>
                    <td className="px-3 py-3 text-zinc-700 tabular-nums">{c.data ? formatDateBR(c.data) : '—'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-900">{brl(c.valor)}</td>
                  </tr>
                ))}
                <tr className="bg-tiffany-500/5">
                  <td className="px-3 py-3 font-semibold text-zinc-900" colSpan={3}>
                    Total ({num(m.vendas)} ingressos)
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-tiffany-700">
                    {brl(m.faturamento)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Convidados pela expansão"
        subtitle="Convidados via outbound/expansão — entram na contagem de presença, mas não são venda."
      >
        {EVENTO.convidadosExpansao.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
            Nenhum convidado — será automatizado (expansão). Por ora, preencha em <code>data/evento.ts</code>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-3 py-2 font-medium">Nome</th>
                  <th className="px-3 py-2 font-medium">Origem</th>
                  <th className="px-3 py-2 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {EVENTO.convidadosExpansao.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-200 hover:bg-zinc-100">
                    <td className="px-3 py-3 font-medium text-zinc-900">{c.nome}</td>
                    <td className="px-3 py-3 text-xs text-zinc-600">{c.origem || '—'}</td>
                    <td className="px-3 py-3 text-zinc-700 tabular-nums">{c.data ? formatDateBR(c.data) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
