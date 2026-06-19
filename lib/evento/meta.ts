// Métricas de mídia (Meta Ads) do Evento Presencial — SOMENTE LEITURA.
// Filtra campanhas por nome (env EVENTO_CAMPAIGN_FILTER, ex: "[EVENTO]").
// Enquanto a campanha não existir/gastar, devolve zeros com aviso.

const TOKEN = process.env.META_ACCESS_TOKEN || '';
const ACCOUNT = process.env.META_AD_ACCOUNT_ID || '';
const API_VERSION = process.env.META_API_VERSION || 'v23.0';
const NAME_FILTER = process.env.EVENTO_CAMPAIGN_FILTER || '[EVENTO]';

export type EventoMeta = {
  configured: boolean;
  hasData: boolean;
  filter: string;
  spend: number;
  impressions: number;
  clicks: number;
  linkClicks: number;
  landingPageViews: number;
  leads: number;
  cpm: number;
  ctr: number;
  cpc: number;
  connectRate: number; // LP views / cliques no link
  cpl: number; // gasto / leads
  warning?: string;
};

function empty(extra: Partial<EventoMeta>): EventoMeta {
  return {
    configured: !!(TOKEN && ACCOUNT),
    hasData: false,
    filter: NAME_FILTER,
    spend: 0,
    impressions: 0,
    clicks: 0,
    linkClicks: 0,
    landingPageViews: 0,
    leads: 0,
    cpm: 0,
    ctr: 0,
    cpc: 0,
    connectRate: 0,
    cpl: 0,
    ...extra,
  };
}

type Action = { action_type: string; value: string };
type Row = {
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  inline_link_clicks?: string;
  actions?: Action[];
};

function actionVal(actions: Action[] | undefined, type: string): number {
  return Number(actions?.find((a) => a.action_type === type)?.value ?? 0) || 0;
}

export async function fetchEventoMeta(): Promise<EventoMeta> {
  if (!TOKEN || !ACCOUNT) {
    return empty({ warning: 'Meta não configurado (META_ACCESS_TOKEN / META_AD_ACCOUNT_ID).' });
  }

  try {
    const url = new URL(`https://graph.facebook.com/${API_VERSION}/act_${ACCOUNT}/insights`);
    url.searchParams.set('level', 'campaign');
    url.searchParams.set(
      'fields',
      'campaign_name,spend,impressions,clicks,inline_link_clicks,actions',
    );
    url.searchParams.set('date_preset', 'maximum');
    url.searchParams.set('limit', '500');
    url.searchParams.set('access_token', TOKEN);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    const json = (await res.json()) as { data?: Row[]; error?: { message?: string } };
    if (json.error) return empty({ warning: `Meta API: ${json.error.message}` });

    const filtro = NAME_FILTER.toLowerCase();
    const rows = (json.data || []).filter((r) =>
      (r.campaign_name || '').toLowerCase().includes(filtro),
    );

    let spend = 0,
      impressions = 0,
      clicks = 0,
      linkClicks = 0,
      landingPageViews = 0,
      leads = 0;
    for (const r of rows) {
      spend += Number(r.spend ?? 0) || 0;
      impressions += Number(r.impressions ?? 0) || 0;
      clicks += Number(r.clicks ?? 0) || 0;
      linkClicks += Number(r.inline_link_clicks ?? 0) || 0;
      landingPageViews += actionVal(r.actions, 'landing_page_view');
      leads += Math.max(
        actionVal(r.actions, 'offsite_conversion.fb_pixel_lead'),
        actionVal(r.actions, 'onsite_web_lead'),
        actionVal(r.actions, 'lead'),
      );
    }

    return {
      configured: true,
      hasData: spend > 0 || impressions > 0,
      filter: NAME_FILTER,
      spend,
      impressions,
      clicks,
      linkClicks,
      landingPageViews,
      leads,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      connectRate: linkClicks > 0 ? (landingPageViews / linkClicks) * 100 : 0,
      cpl: leads > 0 ? spend / leads : 0,
    };
  } catch (e) {
    return empty({ warning: e instanceof Error ? e.message : String(e) });
  }
}
