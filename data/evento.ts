// Dados do Evento Presencial (manual / scaffold).
// As integrações (anúncios, ingressos, expansão) virão depois — por ora as listas
// ficam vazias e tudo já calcula sozinho quando preencher.

export type EventoGasto = {
  nome: string;
  valor: number; // R$
  categoria?: string;
};

export type IngressoComprador = {
  id: string;
  nome: string;
  /** Anúncio/campanha de origem. */
  anuncio?: string;
  /** Valor do ingresso pago (R$). */
  valor: number;
  data?: string; // ISO yyyy-mm-dd
};

export type ConvidadoExpansao = {
  id: string;
  nome: string;
  /** Como/por quem foi convidado (expansão / outbound). */
  origem?: string;
  data?: string; // ISO yyyy-mm-dd
};

export const EVENTO = {
  nome: 'Evento Presencial',
  /** Data do evento (ISO) — opcional. */
  data: '',

  /** Funil de reunião (igual ao 1x1): agendamentos/realizadas/vendas a partir do evento. Manual. */
  funil: {
    agendamentos: 0,
    realizadas: 0,
    vendas: 0,
  },

  /** Gastos / investimento do evento. */
  gastos: [] as EventoGasto[],

  /** Compradores de ingresso via ANÚNCIO — ESTES contam como venda/faturamento. */
  compradoresAnuncio: [] as IngressoComprador[],

  /** Convidados pela EXPANSÃO (outbound) — entram na contagem de pessoas, mas NÃO são venda. */
  convidadosExpansao: [] as ConvidadoExpansao[],
};
