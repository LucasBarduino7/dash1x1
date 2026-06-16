// Cliente read-only do Instagram (Graph API) para o dashboard de Social Selling.
// Usa o token Meta compartilhado. Os campos básicos do perfil (seguidores, nº de
// publicações) funcionam com instagram_basic; alcance/engajamento exigem a
// permissão instagram_manage_insights no app — quando ausente, degradamos com aviso.

import {
  emptySocialSummary,
  type SocialDemographics,
  type SocialPost,
  type SocialSummary,
} from './types';

// Token dedicado ao Instagram (System User com instagram_manage_insights).
// Cai pro META_ACCESS_TOKEN (de Ads) só como fallback.
const TOKEN = process.env.SOCIAL_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
const API_VERSION = process.env.META_API_VERSION || 'v23.0';
const IG_ID = process.env.SOCIAL_IG_ACCOUNT_ID || '17841401139264770';
const PAGE_ID = process.env.SOCIAL_FB_PAGE_ID || '255990344274075';
const BASE = `https://graph.facebook.com/${API_VERSION}`;

export type SocialPeriod = { since: string; until: string };

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function gget(
  path: string,
  params: Record<string, string>,
  token: string,
): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams({ ...params, access_token: token }).toString();
  const res = await fetch(`${BASE}/${path}?${qs}`, { cache: 'no-store' });
  const json = (await res.json()) as Record<string, unknown>;
  if (json && (json as { error?: unknown }).error) {
    const err = (json as { error: { message?: string } }).error;
    throw new Error(err.message || 'Erro na Graph API');
  }
  return json;
}

/** Tenta obter o page access token (algumas leituras exigem). Fallback: user token. */
async function resolvePageToken(): Promise<string> {
  try {
    const data = (await gget('me/accounts', { fields: 'access_token,id' }, TOKEN)) as {
      data?: { id: string; access_token: string }[];
    };
    const page = (data.data || []).find((p) => p.id === PAGE_ID);
    return page?.access_token || TOKEN;
  } catch {
    return TOKEN;
  }
}

export async function fetchSocialSummary(period?: SocialPeriod): Promise<SocialSummary> {
  const out = emptySocialSummary();
  if (!TOKEN) {
    out.warnings.push('META_ACCESS_TOKEN não configurado.');
    return out;
  }

  const pageToken = await resolvePageToken();

  // 1) Perfil — funciona com instagram_basic
  try {
    const p = (await gget(
      IG_ID,
      { fields: 'username,name,followers_count,media_count,biography,profile_picture_url,website' },
      pageToken,
    )) as Record<string, unknown>;
    out.profile = {
      username: String(p.username ?? ''),
      name: String(p.name ?? ''),
      followerCount: Number(p.followers_count ?? 0),
      mediaCount: Number(p.media_count ?? 0),
      biography: String(p.biography ?? ''),
      profilePictureUrl: String(p.profile_picture_url ?? ''),
      website: String(p.website ?? ''),
    };
  } catch (e) {
    out.warnings.push(`Perfil do Instagram indisponível: ${msg(e)}`);
  }

  // 2) Insights de conta — exigem instagram_manage_insights
  const since = period?.since;
  const until = period?.until;
  const dateParams: Record<string, string> = since && until ? { since, until } : {};

  // total_value (métricas agregadas do período)
  try {
    const r = (await gget(
      `${IG_ID}/insights`,
      {
        metric: 'reach,accounts_engaged,total_interactions,profile_views',
        metric_type: 'total_value',
        period: 'day',
        ...dateParams,
      },
      pageToken,
    )) as { data?: { name: string; total_value?: { value?: number } }[] };
    for (const m of r.data || []) {
      const v = m.total_value?.value ?? null;
      if (m.name === 'reach') out.reach = v;
      else if (m.name === 'accounts_engaged') out.accountsEngaged = v;
      else if (m.name === 'total_interactions') out.totalInteractions = v;
      else if (m.name === 'profile_views') out.profileViews = v;
    }
    out.insightsAvailable = true;
  } catch (e) {
    out.warnings.push(
      `Métricas de alcance/engajamento indisponíveis (${msg(
        e,
      )}). Para liberar, adicione a permissão "instagram_manage_insights" ao app Meta.`,
    );
  }

  // série diária de alcance (best-effort; só se insights liberadas)
  if (out.insightsAvailable && since && until) {
    try {
      const ts = (await gget(
        `${IG_ID}/insights`,
        { metric: 'reach', period: 'day', since, until },
        pageToken,
      )) as { data?: { name: string; values?: { value: number; end_time: string }[] }[] };
      const series = ts.data?.[0]?.values || [];
      out.timeline = series.map((v) => ({ date: v.end_time.slice(0, 10), reach: v.value }));
    } catch {
      /* série é opcional — silencioso */
    }
  }

  // 3) Publicações recentes + métricas por post
  try {
    out.posts = await fetchPosts(pageToken);
  } catch (e) {
    out.warnings.push(`Publicações indisponíveis: ${msg(e)}`);
  }

  // 4) Demografia de seguidores (best-effort)
  try {
    out.demographics = await fetchDemographics(pageToken);
  } catch {
    /* demografia é opcional — silencioso */
  }

  return out;
}

/** Lista as últimas publicações e tenta puxar reach/saved/shares/views de cada uma. */
async function fetchPosts(token: string, limit = 9): Promise<SocialPost[]> {
  const media = (await gget(
    `${IG_ID}/media`,
    {
      fields:
        'id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count',
      limit: String(limit),
    },
    token,
  )) as { data?: Record<string, unknown>[] };

  const items = media.data || [];
  return Promise.all(
    items.map(async (m) => {
      let reach: number | null = null;
      let saved: number | null = null;
      let shares: number | null = null;
      let views: number | null = null;
      try {
        const ins = (await gget(
          `${String(m.id)}/insights`,
          { metric: 'reach,saved,shares,views' },
          token,
        )) as { data?: { name: string; values?: { value: number }[] }[] };
        for (const it of ins.data || []) {
          const v = it.values?.[0]?.value ?? null;
          if (it.name === 'reach') reach = v;
          else if (it.name === 'saved') saved = v;
          else if (it.name === 'shares') shares = v;
          else if (it.name === 'views') views = v;
        }
      } catch {
        /* métricas por post são best-effort */
      }
      const productType = String(m.media_product_type ?? '');
      return {
        id: String(m.id ?? ''),
        caption: String(m.caption ?? '').slice(0, 160),
        mediaType: productType === 'REELS' ? 'REELS' : String(m.media_type ?? ''),
        permalink: String(m.permalink ?? ''),
        thumbnailUrl: String(m.thumbnail_url ?? m.media_url ?? ''),
        timestamp: String(m.timestamp ?? ''),
        likes: Number(m.like_count ?? 0),
        comments: Number(m.comments_count ?? 0),
        reach,
        saved,
        shares,
        views,
      };
    }),
  );
}

/** Demografia dos seguidores por gênero, idade, cidade e país. */
async function fetchDemographics(token: string): Promise<SocialDemographics> {
  const out: SocialDemographics = { gender: [], ages: [], cities: [], countries: [] };
  const breakdowns: [string, keyof SocialDemographics][] = [
    ['gender', 'gender'],
    ['age', 'ages'],
    ['city', 'cities'],
    ['country', 'countries'],
  ];
  for (const [bd, key] of breakdowns) {
    try {
      const r = (await gget(
        `${IG_ID}/insights`,
        {
          metric: 'follower_demographics',
          period: 'lifetime',
          metric_type: 'total_value',
          timeframe: 'this_month',
          breakdown: bd,
        },
        token,
      )) as {
        data?: {
          total_value?: {
            breakdowns?: { results?: { dimension_values?: string[]; value?: number }[] }[];
          };
        }[];
      };
      const results = r.data?.[0]?.total_value?.breakdowns?.[0]?.results || [];
      out[key] = results
        .map((x) => ({ key: x.dimension_values?.[0] ?? '—', value: Number(x.value ?? 0) }))
        .sort((a, b) => b.value - a.value);
    } catch {
      /* cada breakdown é best-effort */
    }
  }
  return out;
}
