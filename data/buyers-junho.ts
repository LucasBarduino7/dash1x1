// Lista de compradores de JUNHO/2026 — fonte: usuário (manual).
// Mesma estrutura de data/buyers-maio.ts. Comece vazio e adicione vendas
// conforme forem fechando (igual foi feito em maio).

import type { Buyer } from './buyers-maio';

export const COMPRADORES_JUNHO: Buyer[] = [
  {
    id: '01',
    date: '2026-06-10',
    apelido: 'Alexandre',
    plano: 'Scale Anual (12m)',
    nome: 'Alexandre Lima Miranda',
    telefone: '+55 11 99454-3278',
    email: 'alexandrelimamiranda@hotmail.com',
    cpfCnpj: '41.864.515/0001-17',
    total: 15000,
    recebidoMaio: 6000, // entrada R$ 6.000 no Pix (parcelas só a partir de julho)
    closer: 'Otávio',
    obs: 'Entrada R$ 6.000 no Pix. 6x de R$ 1.500 dia 10, a partir de julho.',
    is1x1: true,
    faturamento: 35000, // fatura entre 30k e 40k
  },
  {
    id: '02',
    date: '2026-06-16',
    apelido: 'Felipe e Bruno',
    plano: 'Scale Express (6m)',
    nome: 'Growmetric Ltda.',
    telefone: '+55 41 9881-6587',
    email: 'felipe@growmetric.com.br',
    cpfCnpj: '64.456.040/0001-25',
    total: 6500,
    recebidoMaio: 6500, // R$ 6.500 no Pix à vista
    closer: 'Otávio',
    obs: 'R$ 6.500 no Pix à vista. E-mails: felipe@ e bruno@growmetric.com.br',
    is1x1: true,
    faturamento: 20000,
  },
  {
    id: '03',
    date: '2026-06-19',
    apelido: 'Kelven',
    plano: 'Scale Anual (12m)',
    nome: 'Kelven Guedes Miranda',
    telefone: '+55 62 9235-2638',
    email: 'kelvenguedes@outlook.com',
    total: 13000,
    recebidoMaio: 3000, // entrada R$ 3.000 no Pix (parcelas só a partir de 05/08)
    closer: 'Otávio',
    obs: 'Entrada R$ 3.000 no Pix. 6x de R$ 1.666 a partir de 05/08.',
    is1x1: true,
    faturamento: 30000,
  },
];
