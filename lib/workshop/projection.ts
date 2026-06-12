// Projeção da meta do workshop: meta de ingressos + orçamento de ads,
// ritmo necessário vs atual, CPA necessário vs atual e projeção no ritmo atual.

import {
  GOAL_SPEND,
  GOAL_TICKETS,
  PROJECTION_DEADLINE,
  PROJECTION_START,
} from './event';

export type Projection = {
  goalTickets: number;
  goalSpend: number;
  start: string;
  deadline: string;
  today: string;
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  sold: number;
  spend: number;
  remainingTickets: number;
  /** Meta de CPA = orçamento / meta de ingressos */
  requiredCpa: number;
  /** CPA atual = investido / vendidos */
  currentCpa: number;
  /** Ingressos/dia necessários no tempo restante */
  perDayNeeded: number;
  /** Média de ingressos/dia (vendidos ÷ dias decorridos) */
  perDayCurrent: number;
  /** Investimento médio/dia (investido ÷ dias decorridos) */
  spendPerDay: number;
  /** Falta investir = meta de investimento − já investido */
  remainingSpend: number;
  /** Investimento/dia necessário pra usar o orçamento até o prazo */
  dailySpendNeeded: number;
  /** Projeção de ingressos no prazo, mantendo o ritmo atual */
  projectedByPace: number;
  /** Quanto fica da meta (positivo = abaixo) */
  gapByPace: number;
  /** Projeção se gastar todo o orçamento no CPA atual */
  projectedByBudget: number;
  /** % da meta já vendida */
  pctOfGoal: number;
  onTrack: boolean;
};

/** Data de hoje (yyyy-mm-dd) no fuso de São Paulo. */
function todaySaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    new Date(),
  );
}

function diffDays(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  return Math.round((db - da) / 86_400_000);
}

export function computeProjection(sold: number, spend: number): Projection {
  const start = PROJECTION_START;
  const deadline = PROJECTION_DEADLINE;
  const raw = todaySaoPaulo();
  const today = raw < start ? start : raw > deadline ? deadline : raw;

  // Dias decorridos = hoje − início (ex: 26/05 → 29/05 = 3 dias).
  const daysTotal = diffDays(start, deadline);
  const daysElapsed = Math.min(Math.max(diffDays(start, today), 1), daysTotal);
  const daysRemaining = Math.max(diffDays(today, deadline), 0);

  const remainingTickets = Math.max(GOAL_TICKETS - sold, 0);
  const requiredCpa = GOAL_TICKETS > 0 ? GOAL_SPEND / GOAL_TICKETS : 0;
  const currentCpa = sold > 0 ? spend / sold : 0;
  const perDayNeeded = daysRemaining > 0 ? remainingTickets / daysRemaining : remainingTickets;
  const perDayCurrent = daysElapsed > 0 ? sold / daysElapsed : 0;
  const spendPerDay = daysElapsed > 0 ? spend / daysElapsed : 0;
  const projectedByPace = Math.round(sold + perDayCurrent * daysRemaining);
  const gapByPace = GOAL_TICKETS - projectedByPace;
  const projectedByBudget = currentCpa > 0 ? Math.round(GOAL_SPEND / currentCpa) : 0;
  const pctOfGoal = GOAL_TICKETS > 0 ? (sold / GOAL_TICKETS) * 100 : 0;
  const remainingSpend = Math.max(GOAL_SPEND - spend, 0);
  const dailySpendNeeded = daysRemaining > 0 ? remainingSpend / daysRemaining : 0;

  return {
    goalTickets: GOAL_TICKETS,
    goalSpend: GOAL_SPEND,
    start,
    deadline,
    today,
    daysTotal,
    daysElapsed,
    daysRemaining,
    sold,
    spend,
    remainingTickets,
    requiredCpa,
    currentCpa,
    perDayNeeded,
    perDayCurrent,
    spendPerDay,
    remainingSpend,
    dailySpendNeeded,
    projectedByPace,
    gapByPace,
    projectedByBudget,
    pctOfGoal,
    onTrack: projectedByPace >= GOAL_TICKETS,
  };
}
