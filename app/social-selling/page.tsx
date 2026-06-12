import {
  AlertTriangle,
  AtSign,
  Eye,
  Heart,
  MousePointerClick,
  Sparkles,
  Users,
} from 'lucide-react';
import { fetchSocialSummary } from '@/lib/social/instagram';
import { num } from '@/lib/shared/format';
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

const orMissing = (v: number | null) => (v == null ? '—' : num(v));

export default async function SocialSellingPage() {
  const period = last30();
  const data = await fetchSocialSummary(period);
  const { profile } = data;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:py-10">
      <div className="mb-8 flex items-center gap-4">
        {profile.profilePictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.profilePictureUrl}
            alt={profile.username}
            className="h-14 w-14 rounded-full border border-zinc-200 object-cover"
          />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-full bg-tiffany-500/10 text-tiffany-600">
            <AtSign className="h-6 w-6" />
          </span>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Social Selling</h1>
          <p className="text-sm text-zinc-500">
            Instagram {profile.username ? `· @${profile.username}` : ''} · últimos 30 dias
          </p>
        </div>
      </div>

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

      {/* Perfil */}
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">Perfil</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
        <KPI label="Seguidores" value={num(profile.followerCount)} icon={Users} tone="brand" size="lg" />
        <KPI label="Publicações" value={num(profile.mediaCount)} icon={AtSign} tone="neutral" />
        <KPI
          label="Conta"
          value={profile.username ? `@${profile.username}` : '—'}
          hint={profile.name || undefined}
          icon={Sparkles}
          tone="neutral"
        />
      </div>

      {/* Engajamento (insights) */}
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
        Alcance &amp; engajamento · 30 dias
      </h2>
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI label="Alcance" value={orMissing(data.reach)} icon={Eye} tone="blue" />
        <KPI label="Contas engajadas" value={orMissing(data.accountsEngaged)} icon={Heart} tone="good" />
        <KPI label="Interações" value={orMissing(data.totalInteractions)} icon={Sparkles} tone="brand" />
        <KPI
          label="Cliques no link / visitas"
          value={orMissing(data.linkClicks ?? data.profileViews)}
          icon={MousePointerClick}
          tone="neutral"
        />
      </div>

      {!data.insightsAvailable && (
        <Card title="Métricas de insights bloqueadas">
          <p className="text-sm text-zinc-600">
            Os números de alcance, engajamento e DMs do Instagram exigem a permissão{' '}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">instagram_manage_insights</code>{' '}
            no app Meta usado pelo token. Hoje o token só lê os dados públicos do perfil (seguidores
            e publicações). Assim que a permissão for adicionada ao app, estes cards passam a
            preencher automaticamente — nenhuma mudança de código necessária.
          </p>
        </Card>
      )}
    </main>
  );
}
