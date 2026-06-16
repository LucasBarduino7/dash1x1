// Métricas do canal Social Selling.
// Funil-topo (ativações, agendamentos, realizadas, custo) é manual em data/social-selling.ts.
// Vendas e faturamento são DERIVADOS dos compradores (data/social-buyers.ts),
// pra não manter o número em dois lugares e somar certo no Geral.

import { SOCIAL_BUYERS } from '@/data/social-buyers';
import { SOCIAL_SELLING } from '@/data/social-selling';

export type SocialSellingMetrics = {
  ativacoes: number;
  agendamentos: number;
  realizadas: number;
  vendas: number;
  faturamento: number;
  /** Pós cash: parcelas futuras a receber (total - recebido) dos compradores do canal. */
  posCash: number;
  custo: number;
};

export function getSocialSelling(): SocialSellingMetrics {
  const vendas = SOCIAL_BUYERS.length;
  const faturamento = SOCIAL_BUYERS.reduce((acc, b) => acc + b.recebidoMaio, 0);
  const posCash = SOCIAL_BUYERS.reduce((acc, b) => acc + Math.max(0, b.total - b.recebidoMaio), 0);
  return {
    ativacoes: SOCIAL_SELLING.ativacoes,
    agendamentos: SOCIAL_SELLING.agendamentos,
    realizadas: SOCIAL_SELLING.realizadas,
    vendas,
    faturamento,
    posCash,
    custo: SOCIAL_SELLING.custo,
  };
}
