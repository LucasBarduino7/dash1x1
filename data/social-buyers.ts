// Compradores do canal Social Selling (manual).
// Mesma estrutura dos compradores do 1x1 (reaproveita o tipo Buyer).
// `faturamento` (do cliente) alimenta o Lead Score; `total`/`recebidoMaio` alimentam a tabela.

import type { Buyer } from './buyers-maio';

export const SOCIAL_BUYERS: Buyer[] = [
  // Exemplo (apague e preencha os reais):
  // {
  //   id: '01',
  //   date: '2026-06-10',
  //   apelido: 'Fulano',
  //   plano: 'Scale Growth (8m)',
  //   nome: 'Fulano da Silva',
  //   telefone: '',
  //   email: '',
  //   total: 14000,
  //   recebidoMaio: 10000,
  //   closer: '',
  //   faturamento: 20000, // faturamento do cliente → Lead Score
  // },
];
