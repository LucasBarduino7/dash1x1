// Compradores do canal Social Selling (manual).
// Mesma estrutura dos compradores do 1x1 (reaproveita o tipo Buyer).
// `faturamento` (do cliente) alimenta o Lead Score; `total`/`recebidoMaio` alimentam a tabela.

import type { Buyer } from './buyers-maio';

export const SOCIAL_BUYERS: Buyer[] = [
  {
    id: '01',
    date: '2026-06-11',
    apelido: 'Ariel',
    plano: 'Scale Express (6m)',
    nome: 'Ariel da Silva Serra Gonçalves',
    telefone: '+55 47 9116-4443',
    email: 'ariel.silva.serra@gmail.com',
    cpfCnpj: '43.510.677/0001-82',
    total: 6000,
    recebidoMaio: 6000, // R$ 6.000 no cartão à vista
    closer: 'Otávio',
    obs: 'R$ 6.000 no cartão à vista. Mentoria individual presencial com Marcos.',
    faturamento: 25000,
  },
  {
    id: '02',
    date: '2026-06-15',
    apelido: 'Walife',
    plano: 'Scale Anual (12m)',
    nome: 'Walife Gustavo Cezar Santos',
    telefone: '+55 37 9137-9667',
    email: 'walifegustavo91@gmail.com',
    cpfCnpj: '52.105.861/0001-38',
    total: 12000,
    recebidoMaio: 4000, // entrada R$ 4.000 (2.000 Pix + 2.000 cartão) — parcelas só a partir de julho
    closer: 'Otávio',
    obs: 'Entrada R$ 4.000 (R$ 2.000 Pix + R$ 2.000 cartão). 4x de R$ 2.000 dia 20, a partir de julho.',
    faturamento: 25000, // fatura de 20k a 30k
  },
];
