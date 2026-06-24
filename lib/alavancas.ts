// Calcula as alavancas/projeções do Scale, puxando o Realizado ao vivo dos canais.

import { fetchDashboardData } from '@/lib/onex1/dashboard';
import { getMonth } from '@/lib/onex1/months';
import { fetchWorkshopDashboard } from '@/lib/workshop/dashboard';
import { getSocialSelling } from '@/lib/social/selling';
import { ALAVANCAS, WORKSHOP_AJUSTE_MANUAL, META_SCALE_TOTAL } from '@/data/alavancas';

export async function getAlavancas() {
  const month = getMonth(undefined);

  const [onex1R, workshopR] = await Promise.allSettled([
    fetchDashboardData(month, { since: month.since, until: month.until }),
    fetchWorkshopDashboard(),
  ]);

  const realizadoAuto = {
    onex1: onex1R.status === 'fulfilled' ? onex1R.value.sales.faturamento1x1 : 0,
    social: getSocialSelling().faturamento,
    workshop:
      (workshopR.status === 'fulfilled' ? workshopR.value.kiwify.faturamentoTotal : 0) +
      WORKSHOP_AJUSTE_MANUAL,
  };

  const hoje = new Date();
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diasRestantes = Math.max(1, ultimoDia - hoje.getDate() + 1);

  const alavancas = ALAVANCAS.map((a) => {
    const realizado = a.auto ? realizadoAuto[a.auto] : a.realizado;
    const falta = Math.max(0, a.projetado - realizado);
    const pct = a.projetado > 0 ? Math.min(1, realizado / a.projetado) : 0;
    return {
      nome: a.nome,
      projetado: a.projetado,
      midia: a.midia,
      realizado,
      falta,
      porDia: falta / diasRestantes,
      batido: a.projetado > 0 && realizado >= a.projetado,
      roasAtual: a.midia > 0 ? realizado / a.midia : null,
      pct,
      auto: !!a.auto,
    };
  });

  const somas = alavancas.reduce(
    (acc, a) => ({
      midia: acc.midia + a.midia,
      realizado: acc.realizado + a.realizado,
    }),
    { midia: 0, realizado: 0 },
  );

  // Meta consolidada fixa (336k). Forecasting total = (meta − realizado) ÷ dias restantes.
  const faltaTotal = Math.max(0, META_SCALE_TOTAL - somas.realizado);
  const totAlav = {
    projetado: META_SCALE_TOTAL,
    midia: somas.midia,
    realizado: somas.realizado,
    porDia: faltaTotal / diasRestantes,
  };

  const pctTotal = totAlav.projetado > 0 ? Math.min(1, totAlav.realizado / totAlav.projetado) : 0;
  const roasTotal = totAlav.midia > 0 ? totAlav.realizado / totAlav.midia : null;

  return { alavancas, totAlav, diasRestantes, pctTotal, roasTotal, faltaTotal, mesLabel: month.label };
}

export type AlavancasData = Awaited<ReturnType<typeof getAlavancas>>;
