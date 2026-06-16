// Dados manuais do canal Social Selling (preenchidos à mão).
// Fonte da verdade até decidirmos puxar de planilha.
// CPR e ROAS dependem do `custo` (custo do canal no mês — ex: SDR).

export type SocialSellingInput = {
  /** Conversas iniciadas/ativadas pelo SDR no Instagram. */
  ativacoes: number;
  /** Reuniões agendadas a partir das ativações. */
  agendamentos: number;
  /** Reuniões realizadas (comparecimentos). */
  realizadas: number;
  /** Vendas fechadas pelo canal. */
  vendas: number;
  /** Faturamento gerado pelo canal (R$). Base do ROAS. */
  faturamento: number;
  /** Custo do canal no mês (R$) — ex: custo do SDR. Base de CPR e ROAS. */
  custo: number;
};

export const SOCIAL_SELLING: SocialSellingInput = {
  ativacoes: 0,
  agendamentos: 0,
  realizadas: 0,
  vendas: 0,
  faturamento: 0,
  custo: 0,
};
