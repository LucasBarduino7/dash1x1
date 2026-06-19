import Link from 'next/link';
import { ArrowRight, CalendarClock, Gauge, HandCoins, ShoppingBag, Users, Wallet } from 'lucide-react';
import { fetchDashboardData } from '@/lib/onex1/dashboard';
import { getMonth } from '@/lib/onex1/months';
import { fetchWorkshopDashboard } from '@/lib/workshop/dashboard';
import { fetchSocialSummary } from '@/lib/social/instagram';
import { brl, num } from '@/lib/shared/format';
import { Card } from '@/components/onex1/Card';
import { KPI } from '@/components/onex1/KPI';
import { QualificationDonut } from '@/components/onex1/charts/QualificationDonut';
import { SalesChart } from '@/components/workshop/charts/SalesChart';
import { getSocialSelling } from '@/lib/social/selling';
import { RECEITAS_AVULSAS } from '@/data/geral-extras';
import { ALAVANCAS } from '@/data/alavancas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function last30(): { since: string; until: string } {
  const until = new Date();
  const since = new Date(until.getTime() - 29 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { since: iso(since), until: iso(until) };
}

function VerTudo({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-tiffany-700 hover:bg-tiffany-500/10"
    >
      ver tudo <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function Indisponivel() {
  return (
    <p className="grid h-[240px] place-items-center text-sm text-zinc-500">
      Dados indisponíveis no momento.
    </p>
  );
}

export default async function Geral() {
  const month = getMonth(undefined);

  const [onex1R, workshopR, socialR] = await Promise.allSettled([
    fetchDashboardData(month, { since: month.since, until: month.until }),
    fetchWorkshopDashboard(),
    fetchSocialSummary(last30()),
  ]);

  // Consolidação do ecossistema: vendas, faturamento e investimento de TODOS os canais.
  const canais = [
    {
      nome: '1x1',
      fat: onex1R.status === 'fulfilled' ? onex1R.value.sales.faturamento1x1 : 0,
      posCash: onex1R.status === 'fulfilled' ? onex1R.value.sales.posCash : 0,
      vendas: onex1R.status === 'fulfilled' ? onex1R.value.sales.totalVendas : 0,
      inv: onex1R.status === 'fulfilled' ? onex1R.value.meta.spendTotal : 0,
      ok: onex1R.status === 'fulfilled',
    },
    {
      nome: 'Workshop',
      fat: workshopR.status === 'fulfilled' ? workshopR.value.kiwify.faturamentoTotal : 0,
      posCash: 0, // ingressos pagos à vista (Kiwify) — sem parcelas a receber
      vendas: workshopR.status === 'fulfilled' ? workshopR.value.kiwify.ingressos : 0,
      inv: workshopR.status === 'fulfilled' ? workshopR.value.meta.summary.spend : 0,
      ok: workshopR.status === 'fulfilled',
    },
    (() => {
      const s = getSocialSelling();
      return {
        nome: 'Social Selling',
        fat: s.faturamento,
        posCash: s.posCash,
        vendas: s.vendas,
        inv: s.custo,
        ok: true,
      };
    })(),
  ];

  // Receitas avulsas (não pertencem a nenhum canal) — entram só no consolidado.
  const avulsoFat = RECEITAS_AVULSAS.reduce((a, r) => a + r.faturamento, 0);
  if (avulsoFat > 0) {
    canais.push({
      nome: 'Outros (Base / avulso)',
      fat: avulsoFat,
      posCash: 0,
      vendas: RECEITAS_AVULSAS.length,
      inv: 0,
      ok: true,
    });
  }
  const totalFat = canais.reduce((a, c) => a + c.fat, 0);
  const totalPosCash = canais.reduce((a, c) => a + c.posCash, 0);
  const totalVendas = canais.reduce((a, c) => a + c.vendas, 0);
  const totalInv = canais.reduce((a, c) => a + c.inv, 0);
  const roasGeral = totalInv > 0 ? totalFat / totalInv : 0;
  const roasTone = roasGeral >= 2 ? 'good' : roasGeral >= 1 ? 'warn' : 'bad';

  // Alavancas & forecasting: o que falta pra bater o projetado, dividido pelos dias restantes do mês.
  const hoje = new Date();
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diasRestantes = Math.max(1, ultimoDia - hoje.getDate() + 1);
  // Realizado puxado ao vivo dos canais (o resto é manual da planilha).
  const realizadoAuto: Record<NonNullable<(typeof ALAVANCAS)[number]['auto']>, number> = {
    onex1: onex1R.status === 'fulfilled' ? onex1R.value.sales.faturamento1x1 : 0,
    social: getSocialSelling().faturamento,
    workshop: workshopR.status === 'fulfilled' ? workshopR.value.kiwify.faturamentoTotal : 0,
  };
  const alavancas = ALAVANCAS.map((a) => {
    const realizado = a.auto ? realizadoAuto[a.auto] : a.realizado;
    const falta = Math.max(0, a.projetado - realizado);
    return {
      ...a,
      realizado,
      falta,
      porDia: falta / diasRestantes,
      batido: a.projetado > 0 && realizado >= a.projetado,
      // ROAS atual = quanto retornou por R$ 1 de mídia (não o alvo).
      roasAtual: a.midia > 0 ? realizado / a.midia : null,
    };
  });
  const totAlav = alavancas.reduce(
    (acc, a) => ({
      projetado: acc.projetado + a.projetado,
      midia: acc.midia + a.midia,
      realizado: acc.realizado + a.realizado,
      porDia: acc.porDia + a.porDia,
    }),
    { projetado: 0, midia: 0, realizado: 0, porDia: 0 },
  );

  // Timeline combinada do workshop (ingressos por dia + investimento por dia)
  let workshopChart: { date: string; ingressos: number; spend: number }[] = [];
  if (workshopR.status === 'fulfilled') {
    const w = workshopR.value;
    const spendByDate = new Map(w.meta.timeline.map((t) => [t.date, t.spend]));
    const ingByDate = new Map(w.kiwify.timeline.map((t) => [t.date, t.ingressos]));
    const dates = Array.from(new Set([...spendByDate.keys(), ...ingByDate.keys()])).sort();
    workshopChart = dates.map((date) => ({
      date,
      ingressos: ingByDate.get(date) ?? 0,
      spend: spendByDate.get(date) ?? 0,
    }));
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Visão geral</h1>
        <p className="text-sm text-zinc-500">Resumo dos dashboards do ecossistema Scale</p>
      </div>

      {/* Consolidado do ecossistema */}
      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KPI
          label="Faturamento total"
          value={brl(totalFat)}
          hint="Todos os canais somados"
          icon={HandCoins}
          tone="good"
          size="lg"
        />
        <KPI
          label="Pós Cash total"
          value={brl(totalPosCash)}
          hint="Parcelas futuras a receber"
          icon={CalendarClock}
          tone="brand"
          size="lg"
        />
        <KPI
          label="Vendas totais"
          value={num(totalVendas)}
          hint="1x1 + Workshop + Social"
          icon={ShoppingBag}
          tone="brand"
          size="lg"
        />
        <KPI
          label="Investimento total"
          value={brl(totalInv)}
          hint="Tudo que está sendo investido"
          icon={Wallet}
          tone="brand"
          size="lg"
        />
        <KPI
          label="ROAS geral"
          value={`${roasGeral.toFixed(2).replace('.', ',')}×`}
          hint="Faturamento ÷ investimento total"
          icon={Gauge}
          tone={roasTone}
          size="lg"
        />
      </section>

      {/* Quebra por canal */}
      <Card className="mb-6" title="Por canal" subtitle="Faturamento, investimento e ROAS de cada dashboard">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2 font-medium">Canal</th>
                <th className="px-3 py-2 text-right font-medium">Vendas</th>
                <th className="px-3 py-2 text-right font-medium">Faturamento</th>
                <th className="px-3 py-2 text-right font-medium">A receber</th>
                <th className="px-3 py-2 text-right font-medium">Investimento</th>
                <th className="px-3 py-2 text-right font-medium">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {canais.map((c) => {
                const roas = c.inv > 0 ? c.fat / c.inv : 0;
                return (
                  <tr key={c.nome} className="border-b border-zinc-200 hover:bg-zinc-100">
                    <td className="px-3 py-3 font-medium text-zinc-900">
                      {c.nome}
                      {!c.ok && <span className="ml-2 text-[10px] text-amber-600">indisponível</span>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{num(c.vendas)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-900">{brl(c.fat)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{brl(c.posCash)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{brl(c.inv)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-zinc-700">
                      {c.inv > 0 ? `${roas.toFixed(2).replace('.', ',')}×` : '—'}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-tiffany-500/5">
                <td className="px-3 py-3 font-semibold text-zinc-900">Total</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-zinc-900">{num(totalVendas)}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-zinc-900">{brl(totalFat)}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-zinc-900">{brl(totalPosCash)}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-zinc-900">{brl(totalInv)}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-tiffany-700">
                  {totalInv > 0 ? `${roasGeral.toFixed(2).replace('.', ',')}×` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Alavancas & projeções */}
      <Card
        className="mb-6"
        title="Alavancas & projeções"
        subtitle="Projetado a receber · Mídia a investir · ROAS atual (realizado ÷ mídia) · Realizado (o que temos) · Forecasting (quanto falta por dia pra bater)"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2 font-medium">Alavanca</th>
                <th className="px-3 py-2 text-right font-medium">Projetado</th>
                <th className="px-3 py-2 text-right font-medium">Mídia</th>
                <th className="px-3 py-2 text-right font-medium">ROAS</th>
                <th className="px-3 py-2 text-right font-medium">Realizado</th>
                <th className="px-3 py-2 text-right font-medium">Forecasting (R$/dia)</th>
              </tr>
            </thead>
            <tbody>
              {alavancas.map((a) => (
                <tr key={a.nome} className="border-b border-zinc-200 hover:bg-zinc-100">
                  <td className="px-3 py-3 font-medium text-zinc-900">{a.nome}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{brl(a.projetado)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{brl(a.midia)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-500">
                    {a.roasAtual != null ? `${a.roasAtual.toFixed(2).replace('.', ',')}×` : '—'}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-zinc-900">{brl(a.realizado)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {a.projetado === 0 ? (
                      <span className="text-zinc-400">—</span>
                    ) : a.batido ? (
                      <span className="font-medium text-emerald-600">✓ batido</span>
                    ) : (
                      <span className="font-medium text-tiffany-700">{brl(a.porDia)}/dia</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-tiffany-500/5">
                <td className="px-3 py-3 font-semibold text-zinc-900">Scale (total a faturar)</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-zinc-900">{brl(totAlav.projetado)}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-zinc-900">{brl(totAlav.midia)}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-zinc-500">
                  {totAlav.midia > 0
                    ? `${(totAlav.realizado / totAlav.midia).toFixed(2).replace('.', ',')}×`
                    : '—'}
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-zinc-900">{brl(totAlav.realizado)}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-tiffany-700">
                  {totAlav.porDia > 0 ? `${brl(totAlav.porDia)}/dia` : '✓ batido'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Forecasting = (Projetado − Realizado) ÷ {diasRestantes} dias restantes no mês — quanto
          precisa entrar por dia pra bater a meta.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1x1 — donut de qualificação */}
        <Card
          title="1x1"
          subtitle={`Qualificação de leads · ${month.label}`}
          right={<VerTudo href="/1x1" />}
        >
          {onex1R.status === 'fulfilled' ? (
            <QualificationDonut stats={onex1R.value.leads} />
          ) : (
            <Indisponivel />
          )}
        </Card>

        {/* Workshop — ingressos x investimento por dia */}
        <Card
          title="Workshop"
          subtitle="Ingressos e investimento por dia"
          right={<VerTudo href="/workshop" />}
        >
          {workshopR.status === 'fulfilled' && workshopChart.length > 0 ? (
            <div className="pt-2">
              <SalesChart data={workshopChart} />
            </div>
          ) : (
            <Indisponivel />
          )}
        </Card>
      </div>

      {/* Social Selling — perfil (insights limitadas hoje) */}
      <div className="mt-6">
        <Card
          title="Social Selling"
          subtitle="Instagram · @emarcosmachado"
          right={<VerTudo href="/social-selling" />}
        >
          {socialR.status === 'fulfilled' ? (
            <div className="flex flex-wrap items-center gap-8 py-4">
              {socialR.value.profile.profilePictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={socialR.value.profile.profilePictureUrl}
                  alt={socialR.value.profile.username}
                  className="h-24 w-24 rounded-full border border-zinc-200 object-cover"
                />
              ) : (
                <span className="grid h-24 w-24 place-items-center rounded-full bg-tiffany-500/10 text-tiffany-600">
                  <Users className="h-10 w-10" />
                </span>
              )}
              <div className="flex flex-wrap gap-10">
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">Seguidores</p>
                  <p className="mt-1 text-4xl font-semibold tabular-nums text-zinc-900">
                    {num(socialR.value.profile.followerCount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">Publicações</p>
                  <p className="mt-1 text-4xl font-semibold tabular-nums text-zinc-900">
                    {num(socialR.value.profile.mediaCount)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Indisponivel />
          )}
        </Card>
      </div>
    </main>
  );
}
