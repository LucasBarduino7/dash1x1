// Combina tráfego Meta ([AGÊNCIAIA]) + vendas num único payload pro dashboard.
// Fonte das vendas: SOMENTE Kiwify (sem planilha — evita duplicados).

import { EVENT, GOAL_TICKETS, PERIOD } from './event';
import { emptyMetaData, fetchMetaData, type Period } from './meta';
import { emptyKiwifyData, fetchKiwifyData, kiwifyConfigured } from './kiwify';
import type { KiwifyData, WorkshopDashboard } from './types';

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function buildSales(
  period: Period,
  warnings: string[],
): Promise<KiwifyData> {
  if (!kiwifyConfigured()) {
    warnings.push('Kiwify não configurado — vendas indisponíveis.');
    return emptyKiwifyData();
  }
  try {
    return await fetchKiwifyData(period);
  } catch (e) {
    // Sem fallback de planilha (vinha com duplicados). Mostra aviso, não número errado.
    warnings.push(`Kiwify indisponível: ${msg(e)}`);
    return emptyKiwifyData();
  }
}

export async function fetchWorkshopDashboard(
  period: Period = PERIOD,
): Promise<WorkshopDashboard> {
  const warnings: string[] = [];

  const [meta, kiwify] = await Promise.all([
    fetchMetaData(period).catch((e: unknown) => {
      warnings.push(`Meta Ads: ${msg(e)}`);
      return emptyMetaData();
    }),
    buildSales(period, warnings),
  ]);

  const cpa = kiwify.ingressos > 0 ? meta.summary.spend / kiwify.ingressos : 0;

  return {
    period,
    event: EVENT,
    goalTickets: GOAL_TICKETS,
    meta,
    kiwify,
    cpa,
    warnings,
  };
}
