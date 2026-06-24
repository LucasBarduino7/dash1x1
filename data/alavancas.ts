// Alavancas e projeções do Scale — JUNHO (manual, fonte: planilha de metas).
// Projetado = quanto pretende receber · Mídia = quanto vai investir · Realizado = o que já entrou.
// O total "Scale" é a SOMA das alavancas. Forecasting = (projetado - realizado) ÷ dias restantes.

export type Alavanca = {
  nome: string;
  projetado: number; // R$ a receber (meta)
  midia: number; // R$ de investimento em mídia
  roas?: number; // ROAS alvo
  realizado: number; // R$ já realizado (manual)
  /** Quando definido, o Realizado é puxado AO VIVO do canal (ignora o manual acima). */
  auto?: 'onex1' | 'social' | 'workshop';
};

export const ALAVANCAS: Alavanca[] = [
  { nome: 'Alavanca 01 - 1x1', projetado: 35000, midia: 35000, roas: 3, realizado: 0, auto: 'onex1' },
  { nome: 'Alavanca 02 - Social Selling', projetado: 35000, midia: 10000, roas: 5, realizado: 0, auto: 'social' },
  { nome: 'Alavanca 04 - Workshop/Live', projetado: 300000, midia: 100000, roas: 3, realizado: 0, auto: 'workshop' },
  { nome: 'Alavanca 05 - Front End', projetado: 0, midia: 10000, realizado: 0 },
  { nome: 'Alavanca 05 - Base (Expansão)', projetado: 50000, midia: 0, realizado: 0 },
  { nome: 'Alavanca 06 - Base (Comercial)', projetado: 60000, midia: 0, realizado: 25000 },
  { nome: 'Alavanca 07 - Evento Presencial', projetado: 0, midia: 0, realizado: 0 },
  { nome: 'Alavanca 08 - Indicação', projetado: 0, midia: 0, realizado: 0 },
  { nome: 'Alavanca 09 - Osmose', projetado: 0, midia: 0, realizado: 0 },
];

/** Ajuste manual somado ao realizado do Workshop (vendas fora do Kiwify, order bumps manuais, etc.). */
export const WORKSHOP_AJUSTE_MANUAL = 82000;

/** Meta consolidada do mês (R$). A linha "Scale · total" e o forecasting usam este número. */
export const META_SCALE_TOTAL = 336000;

/** ROAS alvo consolidado do Scale (linha de total). */
export const META_SCALE_ROAS = 3.5;
