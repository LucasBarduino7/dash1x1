// Receitas avulsas que entram SÓ no consolidado do Geral (cash do mês),
// sem pertencer a nenhum canal (1x1, Workshop, Social). Preenchido à mão.

export type ReceitaAvulsa = {
  nome: string;
  /** Valor recebido no mês (R$) — entra no cash/faturamento do Geral. */
  faturamento: number;
  obs?: string;
};

export const RECEITAS_AVULSAS: ReceitaAvulsa[] = [
  { nome: 'Mentorado (avulso)', faturamento: 25000, obs: 'Não pertence a nenhum canal' },
  { nome: 'Angelo (Base)', faturamento: 12000, obs: 'Scale Anual (12m), full no cartão' },
];
