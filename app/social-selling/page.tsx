import {
  AlertTriangle,
  AtSign,
  Bookmark,
  CalendarCheck,
  CalendarClock,
  Eye,
  Gauge,
  HandCoins,
  Heart,
  MessageCircle,
  MousePointerClick,
  Send,
  ShoppingBag,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { fetchSocialSummary } from '@/lib/social/instagram';
import { brl, formatDateBR, num, pct } from '@/lib/shared/format';
import { KPI } from '@/components/onex1/KPI';
import { Card } from '@/components/onex1/Card';
import { LeadScoreTable, notaComprador } from '@/components/onex1/LeadScoreTable';
import { Sidebar, type SocialTab } from '@/components/social/Sidebar';
import { getSocialSelling } from '@/lib/social/selling';
import { SOCIAL_BUYERS } from '@/data/social-buyers';
import type { BuyerMatch } from '@/lib/onex1/types';
import type { SocialBreakdownRow, SocialPost, SocialSummary } from '@/lib/social/types';

/** Converte os compradores manuais do canal no formato BuyerMatch (reuso das tabelas do 1x1). */
function socialBuyers(): BuyerMatch[] {
  return SOCIAL_BUYERS.map((b) => ({
    buyerId: b.id,
    apelido: b.apelido,
    nome: b.nome,
    plano: b.plano,
    date: b.date,
    recebidoMaio: b.recebidoMaio,
    total: b.total,
    is1x1: true,
    matchType: 'override',
    faturamento: b.faturamento,
  }));
}

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

export default async function SocialSellingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const VALID: SocialTab[] = ['principais', 'secundarias', 'compradores', 'leadscore'];
  const tab: SocialTab = VALID.includes(sp.tab as SocialTab) ? (sp.tab as SocialTab) : 'principais';
  // Insights do Instagram só são buscados na aba secundária (chamada pesada).
  const data = tab === 'secundarias' ? await fetchSocialSummary(last30()) : null;
  const buyers = socialBuyers();

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Social Selling</h1>
        <p className="text-sm text-zinc-500">Funil do canal de prospecção no Instagram</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Sidebar active={tab} />
        <div className="min-w-0 flex-1">
          {tab === 'principais' && <SectionPrincipais buyers={buyers} />}
          {tab === 'secundarias' && data && <SectionSecundarias data={data} />}
          {tab === 'compradores' && <SectionCompradores buyers={buyers} />}
          {tab === 'leadscore' && <SectionLeadScore buyers={buyers} />}
        </div>
      </div>
    </main>
  );
}

// ---------- Métricas Principais (funil do canal) ----------

function SectionPrincipais({ buyers }: { buyers: BuyerMatch[] }) {
  const s = getSocialSelling();
  const posCash = buyers.reduce((acc, b) => acc + Math.max(0, b.total - b.recebidoMaio), 0);
  const taxa = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
  const taxaAgend = taxa(s.agendamentos, s.ativacoes);
  const taxaComp = taxa(s.realizadas, s.agendamentos);
  const taxaConv = taxa(s.vendas, s.realizadas);
  const cpr = s.realizadas > 0 ? s.custo / s.realizadas : 0;
  const roas = s.custo > 0 ? s.faturamento / s.custo : 0;
  const hasData = s.ativacoes + s.agendamentos + s.realizadas + s.vendas > 0;

  return (
    <div className="space-y-6">
      {!hasData && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Ainda sem dados do canal — preencha os números em{' '}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">data/social-selling.ts</code>.
          </span>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KPI
          label="Ativações"
          value={num(s.ativacoes)}
          hint="Conversas iniciadas no Instagram"
          icon={MessageCircle}
          tone="brand"
          size="lg"
        />
        <KPI
          label="Agendamentos"
          value={num(s.agendamentos)}
          hint={`${pct(taxaAgend)} das ativações`}
          icon={CalendarCheck}
          tone="brand"
          size="lg"
        />
        <KPI
          label="Realizadas"
          value={num(s.realizadas)}
          hint={`${pct(taxaComp)} de comparecimento`}
          icon={CalendarCheck}
          tone="brand"
          size="lg"
        />
        <KPI
          label="CPR"
          value={cpr > 0 ? brl(cpr) : '—'}
          hint="Custo por reunião realizada"
          icon={Target}
          tone="brand"
          size="lg"
        />
        <KPI
          label="Vendas"
          value={num(s.vendas)}
          hint={`${pct(taxaConv)} de conversão`}
          icon={ShoppingBag}
          tone="brand"
          size="lg"
        />
        <KPI
          label="ROAS"
          value={roas > 0 ? `${roas.toFixed(2).replace('.', ',')}×` : '—'}
          hint="Faturamento ÷ custo do canal"
          icon={Gauge}
          tone="brand"
          size="lg"
        />
      </section>

      <Card
        title="Vendas e compradores"
        subtitle="Vendas fechadas pelo social selling no mês."
        right={
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-700">
            <ShoppingBag className="h-3.5 w-3.5" />
            {num(s.vendas)} vendas · {brl(s.faturamento)}
          </span>
        }
      >
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KPI label="Faturamento" value={brl(s.faturamento)} hint="Recebido no mês" icon={HandCoins} tone="brand" size="lg" />
          <KPI label="Pós Cash" value={brl(posCash)} hint="Parcelas futuras a receber" icon={CalendarClock} tone="brand" size="lg" />
        </div>
        <h3 className="mb-3 text-sm font-medium text-zinc-800">Compradores do mês</h3>
        <SocialBuyersTable buyers={buyers} />
      </Card>
    </div>
  );
}

// ---------- Compradores ----------

function SectionCompradores({ buyers }: { buyers: BuyerMatch[] }) {
  const faturamento = buyers.reduce((acc, b) => acc + b.recebidoMaio, 0);
  const posCash = buyers.reduce((acc, b) => acc + Math.max(0, b.total - b.recebidoMaio), 0);
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI label="Compradores" value={num(buyers.length)} hint="Vendas do canal no mês" icon={ShoppingBag} tone="brand" size="lg" />
        <KPI label="Faturamento" value={brl(faturamento)} hint="Recebido no mês" icon={HandCoins} tone="brand" size="lg" />
        <KPI label="Pós Cash" value={brl(posCash)} hint="Parcelas futuras a receber" icon={CalendarClock} tone="brand" size="lg" />
      </section>
      <Card
        title="Compradores do canal"
        subtitle="Vendas fechadas pelo social selling no mês."
      >
        <SocialBuyersTable buyers={buyers} />
      </Card>
    </div>
  );
}

function SocialBuyersTable({ buyers }: { buyers: BuyerMatch[] }) {
  if (buyers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
        Nenhum comprador cadastrado — preencha em <code>data/social-buyers.ts</code>.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2 font-medium">Data</th>
            <th className="px-3 py-2 font-medium">Comprador</th>
            <th className="px-3 py-2 font-medium">Plano</th>
            <th className="px-3 py-2 text-right font-medium">Total contrato</th>
            <th className="px-3 py-2 text-right font-medium">Recebido no mês</th>
          </tr>
        </thead>
        <tbody>
          {buyers.map((b) => (
            <tr key={b.buyerId} className="border-b border-zinc-200 transition-colors hover:bg-zinc-100">
              <td className="px-3 py-3 text-zinc-700 tabular-nums">{formatDateBR(b.date)}</td>
              <td className="px-3 py-3">
                <div className="font-medium text-zinc-900">{b.apelido}</div>
                <div className="mt-0.5 truncate text-[11px] text-zinc-500" title={b.nome}>
                  {b.nome}
                </div>
              </td>
              <td className="px-3 py-3 text-xs text-zinc-700">{b.plano}</td>
              <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{brl(b.total)}</td>
              <td className="px-3 py-3 text-right tabular-nums font-medium text-zinc-900">
                {brl(b.recebidoMaio)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Lead Score ----------

function SectionLeadScore({ buyers }: { buyers: BuyerMatch[] }) {
  const notas = buyers
    .map((b) => notaComprador(b).nota)
    .filter((n): n is number => n != null);
  const notaMedia = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI label="Compradores" value={num(buyers.length)} hint={`${num(notas.length)} com nota calculada`} icon={ShoppingBag} tone="brand" size="lg" />
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
        <LeadScoreTable buyers={buyers} />
      </Card>
    </div>
  );
}

// ---------- Métricas Secundárias (Instagram) ----------

function SectionSecundarias({ data }: { data: SocialSummary }) {
  const { profile, demographics, posts } = data;
  const topPosts = [...posts].sort((a, b) => engajamento(b) - engajamento(a));

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        {profile.profilePictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.profilePictureUrl}
            alt={profile.username}
            className="h-12 w-12 rounded-full border border-zinc-200 object-cover"
          />
        ) : (
          <span className="grid h-12 w-12 place-items-center rounded-full bg-tiffany-500/10 text-tiffany-600">
            <AtSign className="h-5 w-5" />
          </span>
        )}
        <p className="text-sm text-zinc-500">
          Instagram {profile.username ? `· @${profile.username}` : ''} · últimos 30 dias
        </p>
      </div>

      {data.warnings.length > 0 && (
        <div className="space-y-2">
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
      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-tiffany-700">Perfil</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
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
      </div>

      {/* Alcance & engajamento */}
      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-tiffany-700">
          Alcance &amp; engajamento · 30 dias
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KPI label="Alcance" value={orMissing(data.reach)} icon={Eye} tone="brand" size="lg" />
          <KPI label="Contas engajadas" value={orMissing(data.accountsEngaged)} icon={Heart} tone="brand" size="lg" />
          <KPI label="Interações" value={orMissing(data.totalInteractions)} icon={Sparkles} tone="brand" size="lg" />
          <KPI label="Visitas ao perfil" value={orMissing(data.profileViews)} icon={MousePointerClick} tone="brand" size="lg" />
        </div>
      </div>

      {/* Demografia */}
      {(demographics.gender.length > 0 ||
        demographics.ages.length > 0 ||
        demographics.cities.length > 0) && (
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-tiffany-700">
            Demografia dos seguidores
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        </div>
      )}

      {/* Posts */}
      {topPosts.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-tiffany-700">
            Publicações recentes · ordenadas por engajamento
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </div>
      )}
    </div>
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
