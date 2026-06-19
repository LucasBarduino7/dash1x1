// Alavancas e projeções do Scale (manual — fonte: planilha de metas).
// Projetado = quanto pretende receber · Mídia = quanto vai investir · Realizado = o que já entrou.
// Forecasting (calculado no Geral) = (projetado - realizado) ÷ dias restantes no mês.

export type Alavanca = {
  nome: string;
  projetado: number; // R$ a receber (meta)
  midia: number; // R$ de investimento em mídia
  roas?: number; // ROAS alvo
  realizado: number; // R$ já realizado
};

export const ALAVANCAS: Alavanca[] = [
  { nome: 'Alavanca 01 - 1x1 (OD)', projetado: 200000, midia: 50000, roas: 3, realizado: 126500 },
  { nome: 'Alavanca 03 - Social Selling', projetado: 60000, midia: 10000, roas: 5, realizado: 38000 },
  { nome: 'Alavanca 04 - Workshop/Live', projetado: 0, midia: 100000, roas: 3, realizado: 0 },
  { nome: 'Alavanca 05 - Front End', projetado: 0, midia: 10000, realizado: 0 },
  { nome: 'Alavanca 05 - Base (Expansão)', projetado: 40000, midia: 0, realizado: 40500 },
  { nome: 'Alavanca 06 - Base (Comercial)', projetado: 50000, midia: 0, realizado: 71500 },
  { nome: 'Alavanca 07 - Evento Presencial', projetado: 150000, midia: 0, realizado: 226000 },
];

/** Meta consolidada do Scale (linha de total da planilha). */
export const META_SCALE_ROAS = 3.5;
