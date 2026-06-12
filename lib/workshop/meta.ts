// Cliente Meta Marketing API — SOMENTE LEITURA.
// Puxa apenas as campanhas cujo nome contém o filtro (ex: [AgênciaIA]).
// Nunca chama endpoints que modifiquem campanha/conjunto/anúncio.

import type {
  AdSales,
  AgeSales,
  CampaignRow,
  MetaAction,
  MetaData,
  MetaInsight,
  MetaSummary,
  PlacementSales,
} from './types';

const TOKEN = process.env.META_ACCESS_TOKEN!;
const ACCOUNT = process.env.META_AD_ACCOUNT_ID!;
const API_VERSION = process.env.META_API_VERSION || 'v23.0';
const NAME_FILTER = process.env.WORKSHOP_CAMPAIGN_FILTER || 'AGÊNCIAIA';

const BASE = `https://graph.facebook.com/${API_VERSION}/act_${ACCOUNT}`;

export type Period = { since: string; until: string };

async function metaGet(path: string, params: Record<string, string>): Promise<unknown> {
  if (!TOKEN || !ACCOUNT) {
    throw new Error('Credenciais do Meta ausentes (META_ACCESS_TOKEN / META_AD_ACCOUNT_ID).');
  }
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

function landingPageViews(actions: MetaAction[] | undefined): number {
  return (
    actionValue(actions, 'landing_page_view') ||
    actionValue(actions, 'omni_landing_page_view')
  );
}

function linkClicks(r: MetaInsight): number {
  return Number(r.inline_link_clicks) || actionValue(r.actions, 'link_click');
}

// Compras atribuídas pelo pixel. Vários action_types reportam o mesmo total;
// pegamos o maior pra não duplicar.
const PURCHASE_TYPES = [
  'offsite_conversion.fb_pixel_purchase',
  'purchase',
  'omni_purchase',
  'onsite_web_purchase',
];
function purchaseCount(actions?: MetaAction[]): number {
  if (!actions) return 0;
  let max = 0;
  for (const t of PURCHASE_TYPES) {
    const a = actions.find((x) => x.action_type === t);
    if (a) max = Math.max(max, Number(a.value) || 0);
  }
  return max;
}

const CHECKOUT_TYPES = [
  'offsite_conversion.fb_pixel_initiate_checkout',
  'initiate_checkout',
  'omni_initiated_checkout',
  'onsite_web_initiate_checkout',
];
function checkoutCount(actions?: MetaAction[]): number {
  if (!actions) return 0;
  let max = 0;
  for (const t of CHECKOUT_TYPES) {
    const a = actions.find((x) => x.action_type === t);
    if (a) max = Math.max(max, Number(a.value) || 0);
  }
  return max;
}

const INSIGHT_FIELDS = [
  'campaign_id',
  'campaign_name',
  'spend',
  'impressions',
  'reach',
  'clicks',
  'cpm',
  'cpc',
  'ctr',
  'inline_link_clicks',
  'actions',
].join(',');

async function fetchInsights(opts: {
  period: Period;
  level: 'account' | 'campaign' | 'ad';
  time_increment?: string;
  fields?: string;
  breakdowns?: string[];
}): Promise<MetaInsight[]> {
  const { since, until } = opts.period;
  const params: Record<string, string> = {
    level: opts.level,
    fields: opts.fields ?? INSIGHT_FIELDS,
    time_range: JSON.stringify({ since, until }),
    filtering: JSON.stringify([
      { field: 'campaign.name', operator: 'CONTAIN', value: NAME_FILTER },
    ]),
    limit: '500',
  };
  if (opts.time_increment) params.time_increment = opts.time_increment;
  if (opts.breakdowns?.length) params.breakdowns = opts.breakdowns.join(',');

  const data = (await metaGet('/insights', params)) as { data: MetaInsight[] };
  return data.data || [];
}

function emptySummary(): MetaSummary {
  return {
    spend: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
    linkClicks: 0,
    landingPageViews: 0,
    initiateCheckout: 0,
    purchases: 0,
    cpm: 0,
    cpc: 0,
    ctr: 0,
    connectRate: 0,
    salesPageConv: 0,
    checkoutConv: 0,
  };
}

export async function fetchMetaData(period: Period): Promise<MetaData> {
  const [campaignsRaw, dailyRaw, adsRaw, ageRaw, placementRaw] = await Promise.all([
    fetchInsights({ period, level: 'campaign' }),
    fetchInsights({ period, level: 'account', time_increment: '1' }),
    fetchInsights({ period, level: 'ad', fields: 'ad_name,spend,actions' }),
    fetchInsights({ period, level: 'account', breakdowns: ['age'], fields: 'spend,actions' }),
    fetchInsights({
      period,
      level: 'account',
      breakdowns: ['publisher_platform', 'platform_position'],
      fields: 'spend,actions',
    }),
  ]);

  const campaigns: CampaignRow[] = campaignsRaw.map((r) => {
    const spend = Number(r.spend) || 0;
    const impressions = Number(r.impressions) || 0;
    const clicks = Number(r.clicks) || 0;
    const lc = linkClicks(r);
    const lpv = landingPageViews(r.actions);
    return {
      id: r.campaign_id || '',
      name: r.campaign_name || '(sem nome)',
      spend,
      impressions,
      clicks,
      cpm: Number(r.cpm) || 0,
      ctr: Number(r.ctr) || 0,
      connectRate: lc > 0 ? (lpv / lc) * 100 : 0,
    };
  });

  const summary = campaignsRaw.reduce<MetaSummary>((acc, r) => {
    acc.spend += Number(r.spend) || 0;
    acc.impressions += Number(r.impressions) || 0;
    acc.reach += Number(r.reach) || 0;
    acc.clicks += Number(r.clicks) || 0;
    acc.linkClicks += linkClicks(r);
    acc.landingPageViews += landingPageViews(r.actions);
    acc.initiateCheckout += checkoutCount(r.actions);
    acc.purchases += purchaseCount(r.actions);
    return acc;
  }, emptySummary());

  summary.cpm = summary.impressions > 0 ? (summary.spend / summary.impressions) * 1000 : 0;
  summary.cpc = summary.clicks > 0 ? summary.spend / summary.clicks : 0;
  summary.ctr = summary.impressions > 0 ? (summary.clicks / summary.impressions) * 100 : 0;
  summary.connectRate =
    summary.linkClicks > 0 ? (summary.landingPageViews / summary.linkClicks) * 100 : 0;
  summary.salesPageConv =
    summary.landingPageViews > 0 ? (summary.initiateCheckout / summary.landingPageViews) * 100 : 0;
  summary.checkoutConv =
    summary.initiateCheckout > 0 ? (summary.purchases / summary.initiateCheckout) * 100 : 0;

  const timeline = dailyRaw
    .map((r) => ({ date: r.date_start, spend: Number(r.spend) || 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Ads que mais vendem (agrega por nome do anúncio — mesmo criativo em vários conjuntos)
  const adAgg = new Map<string, { name: string; purchases: number; spend: number }>();
  for (const r of adsRaw) {
    const name = (r.ad_name || '').trim() || '(sem nome)';
    const cur = adAgg.get(name) ?? { name, purchases: 0, spend: 0 };
    cur.purchases += purchaseCount(r.actions);
    cur.spend += Number(r.spend) || 0;
    adAgg.set(name, cur);
  }
  const topAds: AdSales[] = Array.from(adAgg.values())
    .filter((a) => a.purchases > 0)
    .map((a) => ({ ...a, costPerPurchase: a.purchases > 0 ? a.spend / a.purchases : 0 }))
    .sort((a, b) => b.purchases - a.purchases || a.costPerPurchase - b.costPerPurchase);

  // Idade de quem compra
  const ageMap = new Map<string, number>();
  for (const r of ageRaw) {
    const age = String((r as unknown as Record<string, unknown>).age ?? '');
    if (!age) continue;
    ageMap.set(age, (ageMap.get(age) ?? 0) + purchaseCount(r.actions));
  }
  const salesByAge: AgeSales[] = Array.from(ageMap.entries())
    .filter(([, v]) => v > 0)
    .map(([age, purchases]) => ({ age, purchases }))
    .sort((a, b) => a.age.localeCompare(b.age));

  // Posicionamento que mais vende
  const placeMap = new Map<string, number>();
  for (const r of placementRaw) {
    const raw = r as unknown as Record<string, unknown>;
    const pf = String(raw.publisher_platform ?? '');
    const pos = String(raw.platform_position ?? '');
    if (!pf) continue;
    const key = `${pf}/${pos}`;
    placeMap.set(key, (placeMap.get(key) ?? 0) + purchaseCount(r.actions));
  }
  const salesByPlacement: PlacementSales[] = Array.from(placeMap.entries())
    .filter(([, v]) => v > 0)
    .map(([placement, purchases]) => ({ placement, purchases }))
    .sort((a, b) => b.purchases - a.purchases);

  return {
    summary,
    campaigns: campaigns.sort((a, b) => b.spend - a.spend),
    timeline,
    topAds,
    salesByAge,
    salesByPlacement,
  };
}

export function emptyMetaData(): MetaData {
  return {
    summary: emptySummary(),
    campaigns: [],
    timeline: [],
    topAds: [],
    salesByAge: [],
    salesByPlacement: [],
  };
}
