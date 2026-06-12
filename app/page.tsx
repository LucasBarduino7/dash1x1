import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { fetchDashboardData } from '@/lib/onex1/dashboard';
import { getMonth } from '@/lib/onex1/months';
import { fetchWorkshopDashboard } from '@/lib/workshop/dashboard';
import { fetchSocialSummary } from '@/lib/social/instagram';
import { num } from '@/lib/shared/format';
import { Card } from '@/components/onex1/Card';
import { QualificationDonut } from '@/components/onex1/charts/QualificationDonut';
import { SalesChart } from '@/components/workshop/charts/SalesChart';

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
