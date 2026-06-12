// Cliente read-only do Instagram (Graph API) para o dashboard de Social Selling.
// Usa o token Meta compartilhado. Os campos básicos do perfil (seguidores, nº de
// publicações) funcionam com instagram_basic; alcance/engajamento exigem a
// permissão instagram_manage_insights no app — quando ausente, degradamos com aviso.

import { emptySocialSummary, type SocialSummary } from './types';

const TOKEN = process.env.META_ACCESS_TOKEN!;
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

  return out;
}
