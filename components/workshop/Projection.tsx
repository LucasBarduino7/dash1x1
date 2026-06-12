import {
  CalendarClock,
  Coins,
  Flame,
  Gauge,
  Target,
  Ticket,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { brl, formatDateBR, num } from '@/lib/shared/format';
import type { Projection as P } from '@/lib/workshop/projection';
import { KPI } from './KPI';

export function Projection({ p }: { p: P }) {
  const hitsGoal = p.projectedByBudget >= p.goalTickets;
  // Ritmo atual já dá conta da meta no prazo?
  const paceOnTrack = p.perDayCurrent >= p.perDayNeeded;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="mb-5 text-xl font-semibold tracking-tight text-[#0f1716]">
          Projeção até {formatDateBR(p.deadline)}
        </h2>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <KPI label="Meta total (ads)" value={brl(p.goalSpend)} icon={Target} tone="brand" />
          <KPI label="Já investido" value={brl(p.spend)} icon={Wallet} tone="neutral" />
          <KPI label="Falta investir" value={brl(p.remainingSpend)} icon={Coins} tone="warn" />
          <KPI
            label="Dias restantes"
            value={num(p.daysRemaining)}
            hint={`até ${formatDateBR(p.deadline)}`}
            icon={CalendarClock}
            tone="neutral"
          />
          <KPI
            label="Investimento diário necessário"
            value={brl(p.dailySpendNeeded)}
            hint={`${brl(p.remainingSpend)} ÷ ${num(p.daysRemaining)} dias`}
            icon={Wallet}
            tone="brand"
          />
          <KPI
            label="Ingressos projetados"
            value={p.currentCpa > 0 ? num(p.projectedByBudget) : '—'}
            hint={`CPA atual ${brl(p.currentCpa)} · meta ${num(p.goalTickets)}`}
            icon={TrendingUp}
            tone={hitsGoal ? 'good' : 'bad'}
            ratingLabel={
              p.currentCpa > 0 ? (hitsGoal ? 'Bate a meta' : 'Não bate a meta') : undefined
            }
            size="lg"
          />
        </div>
      </div>

      {/* Ritmo de vendas: quantos ingressos/dia faltam pra bater a meta */}
      <div>
        <h2 className="mb-1 text-xl font-semibold tracking-tight text-[#0f1716]">
          Ritmo de vendas
        </h2>
        <p className="mb-5 text-sm text-[#8a9492]">
          Faltam {num(p.remainingTickets)} ingressos em {num(p.daysRemaining)} dias para
          bater a meta de {num(p.goalTickets)}.
        </p>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <KPI
            label="Ingressos/dia necessários"
            value={num(Math.ceil(p.perDayNeeded))}
            hint={`${num(p.remainingTickets)} ÷ ${num(p.daysRemaining)} dias restantes`}
            icon={Flame}
            tone="brand"
            size="lg"
          />
          <KPI
            label="Ritmo atual (ingressos/dia)"
            value={num(Math.round(p.perDayCurrent * 10) / 10)}
            hint={`${num(p.sold)} vendidos em ${num(p.daysElapsed)} dias`}
            icon={Gauge}
            tone={paceOnTrack ? 'good' : 'bad'}
            ratingLabel={paceOnTrack ? 'No ritmo' : 'Abaixo do necessário'}
          />
          <KPI
            label="Ingressos vendidos"
            value={`${num(p.sold)} / ${num(p.goalTickets)}`}
            hint={`${num(Math.round(p.pctOfGoal))}% da meta`}
            icon={Ticket}
            tone="neutral"
          />
        </div>
      </div>
    </div>
  );
}
