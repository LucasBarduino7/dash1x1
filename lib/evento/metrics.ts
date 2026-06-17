// Métricas do Evento Presencial — derivadas das listas em data/evento.ts.
// Só os compradores por anúncio contam como venda/faturamento; convidados pela
// expansão entram só na contagem de pessoas presentes.

import { EVENTO } from '@/data/evento';

export function getEventoMetrics() {
  const gastoTotal = EVENTO.gastos.reduce((acc, g) => acc + g.valor, 0);

  const vendas = EVENTO.compradoresAnuncio.length;
  const faturamento = EVENTO.compradoresAnuncio.reduce((acc, c) => acc + c.valor, 0);

  const convidados = EVENTO.convidadosExpansao.length;
  const totalPessoas = vendas + convidados; // compradores + convidados

  const ticketMedio = vendas > 0 ? faturamento / vendas : 0;
  const cpa = vendas > 0 ? gastoTotal / vendas : 0; // custo por comprador de ingresso
  const roas = gastoTotal > 0 ? faturamento / gastoTotal : 0;

  return { gastoTotal, vendas, faturamento, convidados, totalPessoas, ticketMedio, cpa, roas };
}
