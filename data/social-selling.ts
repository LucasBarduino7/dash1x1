// Dados manuais do FUNIL-TOPO do canal Social Selling (preenchidos à mão).
// Vendas e faturamento NÃO ficam aqui — derivam dos compradores em data/social-buyers.ts
// (ver lib/social/selling.ts). CPR e ROAS usam o `custo`.

export type SocialSellingInput = {
  /** Conversas iniciadas/ativadas pelo SDR no Instagram. */
  ativacoes: number;
  /** Reuniões agendadas a partir das ativações. */
  agendamentos: number;
  /** Reuniões realizadas (comparecimentos). */
  realizadas: number;
  /** Custo do canal no mês (R$) — ex: custo do SDR. Base de CPR e ROAS. */
  custo: number;
};

export const SOCIAL_SELLING: SocialSellingInput = {
  ativacoes: 0,
  agendamentos: 0,
  realizadas: 0,
  custo: 0,
};
