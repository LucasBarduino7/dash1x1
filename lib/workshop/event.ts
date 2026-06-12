// Configuração do evento (Workshop) e do período analisado.
// Tudo vem de env vars com fallback — fácil de ajustar sem mexer no código.

export const EVENT = {
  /** Data de início do workshop (ISO yyyy-mm-dd) */
  start: process.env.WORKSHOP_EVENT_DATE_START || '2026-06-20',
  /** Data de fim do workshop */
  end: process.env.WORKSHOP_EVENT_DATE_END || '2026-06-21',
  label: process.env.WORKSHOP_EVENT_LABEL || 'Workshop AgênciaIA',
};

/** Janela analisada (início das vendas → fim do evento). */
export const PERIOD = {
  since: process.env.WORKSHOP_PERIOD_SINCE || '2026-05-26',
  until: process.env.WORKSHOP_PERIOD_UNTIL || '2026-06-21',
};

/** Meta de ingressos vendidos. */
export const GOAL_TICKETS = Number(process.env.WORKSHOP_GOAL_TICKETS || 600);

/** Meta de investimento total em ads (R$). */
export const GOAL_SPEND = Number(process.env.WORKSHOP_GOAL_SPEND || 100000);

/** Início das vendas (base do cálculo de ritmo). */
export const PROJECTION_START = process.env.WORKSHOP_PROJECTION_START || PERIOD.since;

/** Prazo final pra bater a meta (fim das vendas). */
export const PROJECTION_DEADLINE = process.env.WORKSHOP_PROJECTION_DEADLINE || EVENT.end;

/** Dias inteiros faltando até a data informada (negativo se já passou). */
export function daysUntil(dateISO: string, from: Date = new Date()): number {
  const target = new Date(`${dateISO}T00:00:00`);
  const startOfToday = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((target.getTime() - startOfToday.getTime()) / 86_400_000);
}
