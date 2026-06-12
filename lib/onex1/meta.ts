// Cliente Meta Marketing API — SOMENTE LEITURA.
// IMPORTANTE: nunca chamar endpoints que modifiquem campanha/conjunto/anúncio.
// Apenas GET em /insights, /campaigns, /adsets, /ads.

import type { BreakdownRow, CampaignRow, MetaAction, MetaInsight } from './types';

const TOKEN = process.env.META_ACCESS_TOKEN!;
const ACCOUNT = process.env.META_AD_ACCOUNT_ID!;
const API_VERSION = process.env.META_API_VERSION || 'v23.0';
const NAME_FILTER = process.env.META_CAMPAIGN_FILTER || '[1X1]';

/** Limites do mês ativo (vêm das env vars, define o range permitido no date picker). */
export const ACTIVE_MONTH = {
  since: process.env.PERIOD_SINCE || '2026-05-01',
  until: process.env.PERIOD_UNTIL || '2026-05-31',
};

const BASE = `https://graph.facebook.com/${API_VERSION}/act_${ACCOUNT}`;

async function metaGet(path: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', TOKEN);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Meta API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

function actionValue(actions: MetaAction[] | undefined, type: string): number {
  if (!actions) return 0;
  const a = actions.find((x) => x.action_type === type);
  return a ? Number(a.value) || 0 : 0;
}

/**
 * Soma de leads considerando vários action_types possíveis.
 * Como a planilha "1x1" usa captura via site (Calendly + pixel),
 * priorizamos pixel/onsite_web. Se houver lead via formulário do Meta,
 * o action_type "lead" cobre.
 */
function sumLeads(actions: MetaAction[] | undefined): number {
  if (!actions) return 0;
  const pixel = actionValue(actions, 'offsite_conversion.fb_pixel_lead');
  const onsiteWeb = actionValue(actions, 'onsite_web_lead');
  const lead = actionValue(actions, 'lead');
  // Tomamos o maior pra evitar dupla contagem (Meta normalmente reporta "lead" como total)
  return Math.max(pixel, onsiteWeb, lead);
}

export type Period = { since: string; until: string };

// --- Conjuntos de fields usados na Marketing API ---

const INSIGHT_FIELDS = [
  'campaign_id',
  'campaign_name',
  'adset_id',
  'adset_name',
  'ad_id',
  'ad_name',
  'spend',
  'impressions',
  'reach',
  'clicks',
  'cpm',
  'cpc',
  'ctr',
  'inline_link_clicks',
  'cost_per_inline_link_click',
  'actions',
  'cost_per_action_type',
].join(',');

async function fetchInsights(opts: {
  period: Period;
  level: 'account' | 'campaign' | 'adset' | 'ad';
  breakdowns?: string[];
  time_increment?: string;
}): Promise<MetaInsight[]> {
  const { since, until } = opts.period;
  const params: Record<string, string> = {
    level: opts.level,
    fields: INSIGHT_FIELDS,
    time_range: JSON.stringify({ since, until }),
    filtering: JSON.stringify([
      { field: 'campaign.name', operator: 'CONTAIN', value: NAME_FILTER },
    ]),
    limit: '500',
  };
  if (opts.breakdowns?.length) params.breakdowns = opts.breakdowns.join(',');
  if (opts.time_increment) params.time_increment = opts.time_increment;

  const data = (await metaGet('/insights', params)) as { data: MetaInsight[] };
  return data.data || [];
}

// --- Funções públicas ---

export type MetaDashboard = {
  period: { since: string; until: string };
  summary: {
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    linkClicks: number;
    landingPageViews: number;
    leads: number;
    cpm: number;
    cpc: number;
    ctr: number;
    cpl: number;
    connectRate: number;
  };
  campaigns: CampaignRow[];
  /** Métricas por conjunto (indexado por adset_name) */
  adsetMetrics: Map<string, MetaInsightAgg>;
  /** Métricas por anúncio (indexado por ad_name) */
  adMetrics: Map<string, MetaInsightAgg>;
  age: BreakdownRow[];
  region: BreakdownRow[];
  timeline: { date: string; spend: number; leads: number }[];
  /** Idade × adset_id → distribuição de leads */
  ageByAdset: Map<string, Map<string, number>>;
};

export type MetaInsightAgg = {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  linkClicks: number;
  landingPageViews: number;
  cpm: number;
  ctr: number;
};

/** Agrega métricas indexando por ID (chave de cruzamento com a planilha de origem). */
function aggregateById(
  rows: MetaInsight[],
  keyId: 'adset_id' | 'ad_id',
  keyName: 'adset_name' | 'ad_name',
): Map<string, MetaInsightAgg> {
  const map = new Map<string, MetaInsightAgg>();
  for (const r of rows) {
    const id = (r[keyId] || '') as string;
    const name = (r[keyName] || '') as string;
    if (!id) continue;

    const existing = map.get(id) ?? {
      id,
      name: name || id,
      spend: 0,
      impressions: 0,
      clicks: 0,
      linkClicks: 0,
      landingPageViews: 0,
      cpm: 0,
      ctr: 0,
    };
    existing.spend += Number(r.spend) || 0;
    existing.impressions += Number(r.impressions) || 0;
    existing.clicks += Number(r.clicks) || 0;
    existing.linkClicks += Number(r.inline_link_clicks) || actionValue(r.actions, 'link_click');
    existing.landingPageViews +=
      actionValue(r.actions, 'landing_page_view') || actionValue(r.actions, 'omni_landing_page_view');
    map.set(id, existing);
  }
  for (const v of map.values()) {
    v.cpm = v.impressions > 0 ? (v.spend / v.impressions) * 1000 : 0;
    v.ctr = v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0;
  }
  return map;
}

export async function fetchMetaDashboard(period: Period): Promise<MetaDashboard> {
  // Disparar todas as queries em paralelo (Marketing API permite)
  const [campaignsRaw, adsetsRaw, adsRaw, ageRaw, regionRaw, dailyRaw, ageByAdsetRaw] =
    await Promise.all([
      fetchInsights({ period, level: 'campaign' }),
      fetchInsights({ period, level: 'adset' }),
      fetchInsights({ period, level: 'ad' }),
      fetchInsights({ period, level: 'account', breakdowns: ['age'] }),
      fetchInsights({ period, level: 'account', breakdowns: ['region'] }),
      fetchInsights({ period, level: 'account', time_increment: '1' }),
      fetchInsights({ period, level: 'adset', breakdowns: ['age'] }),
    ]);

  // Campanhas
  const campaigns: CampaignRow[] = campaignsRaw.map((r) => {
    const spend = Number(r.spend) || 0;
    const impressions = Number(r.impressions) || 0;
    const reach = Number(r.reach) || 0;
    const clicks = Number(r.clicks) || 0;
    const linkClicks = Number(r.inline_link_clicks) || actionValue(r.actions, 'link_click');
    const landingPageViews = actionValue(r.actions, 'landing_page_view') || actionValue(r.actions, 'omni_landing_page_view');
    const leads = sumLeads(r.actions);
    return {
      id: r.campaign_id || '',
      name: r.campaign_name || '(sem nome)',
      spend,
      impressions,
      reach,
      clicks,
      cpm: Number(r.cpm) || 0,
      cpc: Number(r.cpc) || 0,
      ctr: Number(r.ctr) || 0,
      linkClicks,
      landingPageViews,
      leads,
      connectRate: linkClicks > 0 ? (landingPageViews / linkClicks) * 100 : 0,
      cpl: leads > 0 ? spend / leads : 0,
    };
  });

  // Agregado total
  const summary = campaigns.reduce(
    (acc, c) => {
      acc.spend += c.spend;
      acc.impressions += c.impressions;
      acc.reach += c.reach;
      acc.clicks += c.clicks;
      acc.linkClicks += c.linkClicks;
      acc.landingPageViews += c.landingPageViews;
      acc.leads += c.leads;
      return acc;
    },
    {
      spend: 0,
      impressions: 0,
      reach: 0,
      clicks: 0,
      linkClicks: 0,
      landingPageViews: 0,
      leads: 0,
      cpm: 0,
      cpc: 0,
      ctr: 0,
      cpl: 0,
      connectRate: 0,
    },
  );
  summary.cpm = summary.impressions > 0 ? (summary.spend / summary.impressions) * 1000 : 0;
  summary.cpc = summary.clicks > 0 ? summary.spend / summary.clicks : 0;
  summary.ctr = summary.impressions > 0 ? (summary.clicks / summary.impressions) * 100 : 0;
  summary.cpl = summary.leads > 0 ? summary.spend / summary.leads : 0;
  summary.connectRate = summary.linkClicks > 0 ? (summary.landingPageViews / summary.linkClicks) * 100 : 0;

  // Breakdown por idade
  const age = aggregateBreakdown(ageRaw, 'age');
  // Breakdown por região
  const region = aggregateBreakdown(regionRaw, 'region');

  // Timeline diária (gasto + leads por dia)
  const timeline = dailyRaw.map((r) => ({
    date: r.date_start,
    spend: Number(r.spend) || 0,
    leads: sumLeads(r.actions),
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Indexar conjuntos e anúncios por ID (chave de cruzamento com a planilha 2)
  const adsetMetrics = aggregateById(adsetsRaw, 'adset_id', 'adset_name');
  const adMetrics = aggregateById(adsRaw, 'ad_id', 'ad_name');

  // Idade × adset_id (pra estimar idade dos qualificados).
  // Usa SOMENTE leads como peso — impressions distorce porque a CTR varia muito por faixa.
  const ageByAdset = new Map<string, Map<string, number>>();
  for (const r of ageByAdsetRaw) {
    const id = r.adset_id;
    const raw = r as unknown as Record<string, unknown>;
    const age = String(raw.age ?? '');
    if (!id || !age) continue;
    const leads = sumLeads(r.actions);
    if (leads <= 0) continue;
    const m = ageByAdset.get(id) ?? new Map<string, number>();
    m.set(age, (m.get(age) ?? 0) + leads);
    ageByAdset.set(id, m);
  }

  return {
    period,
    summary,
    campaigns: campaigns.sort((a, b) => b.spend - a.spend),
    adsetMetrics,
    adMetrics,
    age: age.sort((a, b) => b.leads - a.leads || b.spend - a.spend),
    region: region.sort((a, b) => b.leads - a.leads || b.spend - a.spend).slice(0, 12),
    timeline,
    ageByAdset,
  };
}

function aggregateBreakdown(rows: MetaInsight[], key: string): BreakdownRow[] {
  // O breakdown key vem como propriedade extra no objeto retornado.
  // Tipagem mais ampla pra ler dynamic key.
  return rows
    .map((r) => {
      const raw = r as unknown as Record<string, unknown>;
      return {
        key: String(raw[key] ?? '—'),
        spend: Number(r.spend) || 0,
        impressions: Number(r.impressions) || 0,
        reach: Number(r.reach) || 0,
        clicks: Number(r.clicks) || 0,
        leads: sumLeads(r.actions),
      };
    })
    .filter((r) => r.key !== 'undefined' && r.key !== '—');
}
