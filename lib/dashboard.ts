// Função principal: combina Meta Ads + Planilha 1 (qualificação por cor) +
// Planilha 2 (origem por conjunto/anúncio) cruzando por email + ID.

import type { DashboardData, EnrichedLead, Lead, LeadStatus, RankedRow } from './types';
import { ACTIVE_MONTH, fetchMetaDashboard, type MetaInsightAgg, type Period } from './meta';
import { computeLeadStats, fetchLeads, filterLeadsByPeriod } from './sheet';
import { fetchRawLeads, fetchHistoricalLeads1x1 } from './raw-leads';
import { computeSales } from './buyers';

/** Constrói índice email→status a partir da planilha 1 (cores) */
function indexByEmail(leads: Lead[]): Map<string, LeadStatus> {
  const map = new Map<string, LeadStatus>();
  for (const l of leads) {
    const e = (l.email || '').trim().toLowerCase();
    if (!e) continue;
    map.set(e, l.status);
  }
  return map;
}

/** Cruza planilha 2 (origem) + planilha 1 (status) gerando leads enriquecidos */
function enrichLeads(
  rawLeads: Awaited<ReturnType<typeof fetchRawLeads>>,
  byEmail: Map<string, LeadStatus>,
): { enriched: EnrichedLead[]; warnings: string[] } {
  const warnings: string[] = [];
  let matched = 0;
  const enriched: EnrichedLead[] = [];

  for (const r of rawLeads) {
    const email = (r.email || '').toLowerCase();
    const status = byEmail.get(email);
    if (status) matched++;
    enriched.push({
      email,
      campaignId: r.campaignId,
      adsetId: r.adsetId,
      adId: r.adId,
      status: status ?? 'nao_contactado',
      date: r.date,
    });
  }

  if (rawLeads.length > 0) {
    const pctMatch = ((matched / rawLeads.length) * 100).toFixed(1);
    if (matched === 0) {
      warnings.push(
        `Nenhum lead da planilha de origem foi encontrado na planilha de qualificação. Verifique se ambas têm os mesmos emails.`,
      );
    } else if (matched / rawLeads.length < 0.5) {
      warnings.push(
        `Só ${pctMatch}% dos leads (${matched}/${rawLeads.length}) bateram entre as duas planilhas.`,
      );
    }
  }

  return { enriched, warnings };
}

function rankByKey(
  enriched: EnrichedLead[],
  metaMap: Map<string, MetaInsightAgg>,
  pickKey: (l: EnrichedLead) => string,
): RankedRow[] {
  const byKey = new Map<
    string,
    {
      total: number;
      agendados: number;
      temAgencia: number;
      donoSemFaturamento: number;
      desqualificados: number;
    }
  >();

  for (const lead of enriched) {
    const key = pickKey(lead);
    if (!key) continue;
    const cur =
      byKey.get(key) ?? {
        total: 0,
        agendados: 0,
        temAgencia: 0,
        donoSemFaturamento: 0,
        desqualificados: 0,
      };
    cur.total++;
    if (lead.status === 'agendado') cur.agendados++;
    else if (lead.status === 'tem_agencia') cur.temAgencia++;
    else if (lead.status === 'dono_sem_faturamento') cur.donoSemFaturamento++;
    else if (lead.status === 'desqualificado') cur.desqualificados++;
    byKey.set(key, cur);
  }

  // Considerar APENAS conjuntos/ads que existem no Meta (campanhas [1X1])
  // — assim filtramos automaticamente leads de outras campanhas.
  const allKeys = new Set<string>(metaMap.keys());
  // Adicionar também keys da planilha que estejam no Meta map (já garantido pelo loop acima)

  const rows: RankedRow[] = [];
  for (const key of allKeys) {
    const counts = byKey.get(key) ?? {
      total: 0,
      agendados: 0,
      temAgencia: 0,
      donoSemFaturamento: 0,
      desqualificados: 0,
    };
    const meta = metaMap.get(key)!;
    const qualificados =
      counts.agendados + counts.temAgencia + counts.donoSemFaturamento;
    rows.push({
      id: meta.id,
      name: meta.name,
      spend: meta.spend,
      impressions: meta.impressions,
      clicks: meta.clicks,
      linkClicks: meta.linkClicks,
      landingPageViews: meta.landingPageViews,
      cpm: meta.cpm,
      ctr: meta.ctr,
      leadsTotal: counts.total,
      agendados: counts.agendados,
      temAgencia: counts.temAgencia,
      donoSemFaturamento: counts.donoSemFaturamento,
      desqualificados: counts.desqualificados,
      qualificados,
      taxaQualificacao: counts.total > 0 ? (qualificados / counts.total) * 100 : 0,
      cplQualificado: qualificados > 0 ? meta.spend / qualificados : 0,
      custoPorReuniao: counts.agendados > 0 ? meta.spend / counts.agendados : 0,
    });
  }

  rows.sort(
    (a, b) =>
      b.qualificados - a.qualificados ||
      b.taxaQualificacao - a.taxaQualificacao ||
      b.spend - a.spend,
  );
  return rows;
}

export async function fetchDashboardData(period: Period): Promise<DashboardData> {
  const isSubperiod =
    period.since !== ACTIVE_MONTH.since || period.until !== ACTIVE_MONTH.until;

  const [meta, allLeadsByCor, allRawLeads, allHistoryLeads1x1] = await Promise.all([
    fetchMetaDashboard(period),
    fetchLeads(),
    fetchRawLeads(),
    fetchHistoricalLeads1x1(),
  ]);

  // Filtra cada fonte pelo período selecionado (planilhas têm sempre o mês inteiro).
  const leadsByCor = filterLeadsByPeriod(allLeadsByCor, period.since, period.until);
  const rawLeads = allRawLeads.filter(
    (l) => l.date && l.date >= period.since && l.date <= period.until,
  );
  const historyLeads1x1 = allHistoryLeads1x1.filter(
    (l) => l.date && l.date >= period.since && l.date <= period.until,
  );

  const byEmail = indexByEmail(leadsByCor);
  const { enriched, warnings } = enrichLeads(rawLeads, byEmail);

  // Stats agregados de qualificação: planilha 1 (cores) é a fonte da verdade.
  const leadStats = computeLeadStats(leadsByCor);

  // Rankings cruzados — apenas conjuntos/ads que existem nas campanhas [1X1] do Meta
  const adsetsRanked = rankByKey(enriched, meta.adsetMetrics, (l) => l.adsetId);
  const adsRanked = rankByKey(enriched, meta.adMetrics, (l) => l.adId);

  // Aviso sobre falta de adId na fonte
  const leadsComAdId = enriched.filter((l) => l.adId).length;
  if (leadsComAdId === 0 && enriched.length > 0) {
    warnings.push(
      `A planilha de origem não traz o ID do anúncio (criativo). Ranking de criativos fica vazio até a automação preencher.`,
    );
  }

  // Compradores → vendas, CAC, ROAS
  // Pool 1x1 = aba MM OFICIAL [MAI/2026] (todos 1x1) + histórico filtrado [1X1]
  const pool1x1 = [...rawLeads, ...historyLeads1x1];
  const sales = computeSales(pool1x1, meta.summary.spend, { period, isSubperiod });

  // === Estimativa de idade dos donos de agência ===
  // Lógica: pra cada adset, a taxa de qualificação (donos/total leads na planilha)
  // é aplicada sobre o histograma de idade do adset (do Meta).
  const adsetStats = new Map<string, { qualif: number; total: number }>();
  for (const lead of enriched) {
    if (!lead.adsetId) continue;
    const s = adsetStats.get(lead.adsetId) ?? { qualif: 0, total: 0 };
    s.total++;
    if (
      lead.status === 'agendado' ||
      lead.status === 'tem_agencia' ||
      lead.status === 'dono_sem_faturamento'
    )
      s.qualif++;
    adsetStats.set(lead.adsetId, s);
  }

  const ageQualifAccum = new Map<string, number>();
  for (const [adsetId, ageMap] of meta.ageByAdset.entries()) {
    const stats = adsetStats.get(adsetId);
    if (!stats || stats.total === 0 || stats.qualif === 0) continue;
    const rate = stats.qualif / stats.total;
    for (const [age, weight] of ageMap.entries()) {
      ageQualifAccum.set(age, (ageQualifAccum.get(age) ?? 0) + weight * rate);
    }
  }

  // Normalizar pra somar exatamente o total de qualificados conhecido
  const totalEstimado = Array.from(ageQualifAccum.values()).reduce((a, b) => a + b, 0);
  const totalReal = leadStats.qualificados;
  const factor = totalEstimado > 0 ? totalReal / totalEstimado : 0;
  const qualifiedAgeBreakdown = Array.from(ageQualifAccum.entries())
    .map(([key, v]) => ({ key, qualif: v * factor }))
    .filter((r) => r.qualif > 0.5)
    .sort((a, b) => b.qualif - a.qualif);

  return {
    period: meta.period,
    activeMonth: ACTIVE_MONTH,
    isSubperiod,
    meta: {
      spendTotal: meta.summary.spend,
      impressions: meta.summary.impressions,
      reach: meta.summary.reach,
      clicks: meta.summary.clicks,
      linkClicks: meta.summary.linkClicks,
      landingPageViews: meta.summary.landingPageViews,
      leadsMeta: meta.summary.leads,
      cpm: meta.summary.cpm,
      cpc: meta.summary.cpc,
      ctr: meta.summary.ctr,
      cplMeta: meta.summary.cpl,
      connectRate: meta.summary.connectRate,
    },
    leads: leadStats,
    qualif: {
      custoPorLeadQualificado:
        leadStats.qualificados > 0 ? meta.summary.spend / leadStats.qualificados : 0,
      custoPorReuniao:
        leadStats.agendados > 0 ? meta.summary.spend / leadStats.agendados : 0,
    },
    campaigns: meta.campaigns,
    adsetsRanked,
    adsRanked,
    ageBreakdown: meta.age,
    qualifiedAgeBreakdown,
    regionBreakdown: meta.region,
    dailyTimeline: meta.timeline,
    sales,
    warnings,
  };
}
