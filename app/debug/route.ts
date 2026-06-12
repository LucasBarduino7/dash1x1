import { fetchDashboardData } from '@/lib/onex1/dashboard';
import { getMonth } from '@/lib/onex1/months';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const month = getMonth(url.searchParams.get('month') || undefined);
    const since = url.searchParams.get('since') || month.since;
    const until = url.searchParams.get('until') || month.until;
    const data = await fetchDashboardData(month, { since, until });
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
      validados: {
        thresholds: data.validados.thresholds,
        count: data.validados.adsets.length,
        adsets: data.validados.adsets.map((a) => ({
          name: a.name,
          id: a.id,
          spend: Math.round(a.spend),
          leads: a.leadsTotal,
          agendados: a.agendados,
          taxaAgendamento: Math.round(a.taxaAgendamento * 10) / 10,
          criativos: a.criativos.map((c) => ({
            name: c.name,
            leads: c.leadsTotal,
            agendados: c.agendados,
            taxa: Math.round(c.taxaAgendamento * 10) / 10,
          })),
        })),
      },
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
