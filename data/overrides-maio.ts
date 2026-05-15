// Overrides manuais informados pelo usuário (fonte da verdade).
// Quando algum valor está definido aqui, ele substitui o cálculo automático.

export const SALES_OVERRIDES = {
  /** Faturamento total apenas dos clientes 1x1 (R$). undefined → calcula auto via match. */
  faturamento1x1: undefined as number | undefined,

  /** Faturamento bruto do mês (todos os compradores). undefined → calcula auto. */
  faturamentoBrutoMes: undefined as number | undefined,

  /** Quantidade de vendas 1x1. undefined → usa contagem do match automático. */
  vendas1x1: undefined as number | undefined,

  /** Reuniões REALIZADAS no mês (não as agendadas — só as que aconteceram). */
  reunioesRealizadas: 16 as number | undefined,
};
