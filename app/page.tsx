import Link from 'next/link';
import {
  ArrowRight,
  AtSign,
  Eye,
  HandCoins,
  Heart,
  ShoppingCart,
  Target,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { fetchDashboardData } from '@/lib/onex1/dashboard';
import { getMonth } from '@/lib/onex1/months';
import { fetchWorkshopDashboard } from '@/lib/workshop/dashboard';
import { fetchSocialSummary } from '@/lib/social/instagram';
import { brl, num } from '@/lib/shared/format';
import { KPI } from '@/components/onex1/KPI';
import { Card } from '@/components/onex1/Card';

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
    <p className="py-6 text-center text-sm text-zinc-500">
      Dados indisponíveis no momento.
    </p>
  );
}

export default async function Geral() {
  const month = getMonth(undefined);
  const social30 = last30();

  const [onex1R, workshopR, socialR] = await Promise.allSettled([
    fetchDashboardData(month, { since: month.since, until: month.until }),
    fetchWorkshopDashboard(),
    fetchSocialSummary(social30),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Visão geral</h1>
        <p className="text-sm text-zinc-500">Resumo dos dashboards do ecossistema Scale</p>
      </div>

      <div className="space-y-6">
        {/* 1x1 */}
        <Card title="1x1" subtitle={month.label} right={<VerTudo href="/1x1" />}>
          {onex1R.status === 'fulfilled' ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KPI label="Investimento" value={brl(onex1R.value.meta.spendTotal)} icon={Wallet} tone="brand" />
              <KPI label="Donos de agência" value={num(onex1R.value.leads.qualificados)} icon={Users} tone="neutral" />
              <KPI label="Vendas 1x1" value={num(onex1R.value.sales.totalVendas)} icon={ShoppingCart} tone="good" />
              <KPI label="ROAS" value={`${onex1R.value.sales.roas.toFixed(2)}x`} icon={TrendingUp} tone="blue" />
            </div>
          ) : (
            <Indisponivel />
          )}
        </Card>

        {/* Workshop */}
        <Card title="Workshop" right={<VerTudo href="/workshop" />}>
          {workshopR.status === 'fulfilled' ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KPI label="Ingressos" value={num(workshopR.value.kiwify.ingressos)} icon={Ticket} tone="good" />
              <KPI label="Faturamento" value={brl(workshopR.value.kiwify.faturamentoTotal)} icon={HandCoins} tone="brand" />
              <KPI label="Investimento" value={brl(workshopR.value.meta.summary.spend)} icon={Wallet} tone="neutral" />
              <KPI label="Custo / ingresso" value={brl(workshopR.value.cpa)} icon={Target} tone="warn" />
            </div>
          ) : (
            <Indisponivel />
          )}
        </Card>

        {/* Social Selling */}
        <Card title="Social Selling" subtitle="Instagram · 30 dias" right={<VerTudo href="/social-selling" />}>
          {socialR.status === 'fulfilled' ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KPI label="Seguidores" value={num(socialR.value.profile.followerCount)} icon={Users} tone="brand" />
              <KPI label="Publicações" value={num(socialR.value.profile.mediaCount)} icon={AtSign} tone="neutral" />
              <KPI
                label="Alcance"
                value={socialR.value.reach == null ? '—' : num(socialR.value.reach)}
                icon={Eye}
                tone="blue"
              />
              <KPI
                label="Contas engajadas"
                value={socialR.value.accountsEngaged == null ? '—' : num(socialR.value.accountsEngaged)}
                icon={Heart}
                tone="good"
              />
            </div>
          ) : (
            <Indisponivel />
          )}
        </Card>
      </div>
    </main>
  );
}
