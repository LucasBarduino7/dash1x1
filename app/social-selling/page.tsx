import {
  AlertTriangle,
  AtSign,
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  MousePointerClick,
  Send,
  Sparkles,
  Users,
} from 'lucide-react';
import { fetchSocialSummary } from '@/lib/social/instagram';
import { num } from '@/lib/shared/format';
import { KPI } from '@/components/onex1/KPI';
import { Card } from '@/components/onex1/Card';
import type { SocialBreakdownRow, SocialPost } from '@/lib/social/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function last30(): { since: string; until: string } {
  const until = new Date();
  const since = new Date(until.getTime() - 29 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { since: iso(since), until: iso(until) };
}

const orMissing = (v: number | null) => (v == null ? '—' : num(v));

const GENDER_LABEL: Record<string, string> = { F: 'Feminino', M: 'Masculino', U: 'Outro' };

function engajamento(p: SocialPost): number {
  return p.likes + p.comments + (p.saved ?? 0) + (p.shares ?? 0);
}

export default async function SocialSellingPage() {
  const period = last30();
  const data = await fetchSocialSummary(period);
  const { profile, demographics, posts } = data;

  const topPosts = [...posts].sort((a, b) => engajamento(b) - engajamento(a));

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
        <KPI label="Publicações" value={num(profile.mediaCount)} icon={AtSign} tone="brand" />
        <KPI
          label="Conta"
          value={profile.username ? `@${profile.username}` : '—'}
          hint={profile.name || undefined}
          icon={Sparkles}
          tone="brand"
        />
      </div>

      {/* Engajamento (insights) */}
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
        Alcance &amp; engajamento · 30 dias
      </h2>
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI label="Alcance" value={orMissing(data.reach)} icon={Eye} tone="brand" size="lg" />
        <KPI label="Contas engajadas" value={orMissing(data.accountsEngaged)} icon={Heart} tone="brand" size="lg" />
        <KPI label="Interações" value={orMissing(data.totalInteractions)} icon={Sparkles} tone="brand" size="lg" />
        <KPI label="Visitas ao perfil" value={orMissing(data.profileViews)} icon={MousePointerClick} tone="brand" size="lg" />
      </div>

      {/* Demografia */}
      {(demographics.gender.length > 0 ||
        demographics.ages.length > 0 ||
        demographics.cities.length > 0) && (
        <>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Demografia dos seguidores
          </h2>
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card title="Gênero">
              <BarRows
                rows={demographics.gender.map((r) => ({ ...r, key: GENDER_LABEL[r.key] ?? r.key }))}
              />
            </Card>
            <Card title="Faixa etária">
              <BarRows rows={demographics.ages} />
            </Card>
            <Card title="Top cidades">
              <BarRows rows={demographics.cities.slice(0, 6)} />
            </Card>
            <Card title="Top países">
              <BarRows rows={demographics.countries.slice(0, 6)} />
            </Card>
          </div>
        </>
      )}

      {/* Posts */}
      {topPosts.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Publicações recentes · ordenadas por engajamento
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function BarRows({ rows }: { rows: SocialBreakdownRow[] }) {
  if (rows.length === 0) {
    return <p className="py-4 text-center text-sm text-zinc-500">Sem dados.</p>;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-zinc-600" title={r.key}>
            {r.key}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-tiffany-500"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-xs tabular-nums text-zinc-700">
            {num(r.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PostCard({ post }: { post: SocialPost }) {
  const date = post.timestamp ? post.timestamp.slice(0, 10).split('-').reverse().join('/') : '';
  const tipo =
    post.mediaType === 'REELS'
      ? 'Reels'
      : post.mediaType === 'VIDEO'
        ? 'Vídeo'
        : post.mediaType === 'CAROUSEL_ALBUM'
          ? 'Carrossel'
          : 'Foto';
  return (
    <a
      href={post.permalink || undefined}
      target="_blank"
      rel="noreferrer"
      className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        {post.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnailUrl}
            alt={post.caption || 'post'}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-zinc-400">
            <AtSign className="h-8 w-8" />
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
          {tipo}
        </span>
      </div>
      <div className="p-3">
        {post.caption && <p className="mb-2 line-clamp-2 text-xs text-zinc-600">{post.caption}</p>}
        <div className="grid grid-cols-3 gap-y-2 text-xs text-zinc-700">
          <Stat icon={<Heart className="h-3.5 w-3.5" />} value={post.likes} />
          <Stat icon={<MessageCircle className="h-3.5 w-3.5" />} value={post.comments} />
          <Stat icon={<Eye className="h-3.5 w-3.5" />} value={post.reach} />
          <Stat icon={<Bookmark className="h-3.5 w-3.5" />} value={post.saved} />
          <Stat icon={<Send className="h-3.5 w-3.5" />} value={post.shares} />
          {post.views != null && (
            <Stat icon={<MousePointerClick className="h-3.5 w-3.5" />} value={post.views} />
          )}
        </div>
        {date && <p className="mt-2 text-[10px] text-zinc-400">{date}</p>}
      </div>
    </a>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number | null }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-tiffany-600">{icon}</span>
      <span className="tabular-nums text-zinc-700">{value == null ? '—' : num(value)}</span>
    </span>
  );
}
