import { fetchDashboardData } from '@/lib/dashboard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchDashboardData();
    return Response.json({
      ok: true,
      meta_summary: data.meta,
      leads_stats: data.leads,
      qualif: data.qualif,
      sales: {
        totalVendas: data.sales.totalVendas,
        totalBrutoMes: data.sales.totalBrutoMes,
        faturamento1x1: data.sales.faturamento1x1,
        ticketMedio: data.sales.ticketMedio,
        cac: data.sales.cac,
        roas: data.sales.roas,
        reunioesRealizadas: data.sales.reunioesRealizadas,
        custoPorRealizada: data.sales.custoPorRealizada,
        taxaConversao: data.sales.taxaConversao,
        buyers: data.sales.buyers.map((b) => ({
          id: b.buyerId,
          apelido: b.apelido,
          recebidoMaio: b.recebidoMaio,
          is1x1: b.is1x1,
          matchType: b.matchType,
        })),
      },
      warnings: data.warnings,
      campaigns_count: data.campaigns.length,
      adsets_ranked_count: data.adsetsRanked.length,
      ads_ranked_count: data.adsRanked.length,
      age_breakdown_total: data.ageBreakdown.map((a) => ({ age: a.key, leads: a.leads })),
      age_breakdown_qualified: data.qualifiedAgeBreakdown.map((a) => ({
        age: a.key,
        donos: Math.round(a.qualif * 10) / 10,
      })),
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
