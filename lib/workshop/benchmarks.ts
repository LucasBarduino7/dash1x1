// Classificação das métricas conforme médias de mercado (informadas pelo cliente).
// Cada métrica vira um selo (Excelente/Ótimo/Bom/…) com uma cor (tone) pro card.

export type RatingTone = 'good' | 'blue' | 'warn' | 'bad';
export type Rating = { label: string; tone: RatingTone };

type Band = { min: number; label: string; tone: RatingTone };

// Para métricas onde MAIOR é melhor. Bandas em ordem decrescente de `min`.
function classifyDesc(value: number, bands: Band[]): Rating {
  for (const b of bands) {
    if (value >= b.min) return { label: b.label, tone: b.tone };
  }
  const last = bands[bands.length - 1];
  return { label: last.label, tone: last.tone };
}

const CONNECT_RATE: Band[] = [
  { min: 81, label: 'Excelente', tone: 'good' },
  { min: 75, label: 'Ótimo', tone: 'good' },
  { min: 69, label: 'Bom', tone: 'blue' },
  { min: 61, label: 'Regular', tone: 'warn' },
  { min: 55, label: 'Ruim', tone: 'bad' },
  { min: -Infinity, label: 'Horrível', tone: 'bad' },
];

const CTR: Band[] = [
  { min: 1.8, label: 'Excelente', tone: 'good' },
  { min: 1.5, label: 'Ótimo', tone: 'good' },
  { min: 1.2, label: 'Bom', tone: 'blue' },
  { min: 0.9, label: 'Legal', tone: 'blue' },
  { min: 0.7, label: 'Regular', tone: 'warn' },
  { min: 0.5, label: 'Ruim', tone: 'bad' },
  { min: -Infinity, label: 'Horrível', tone: 'bad' },
];

const SALES_PAGE_CONV: Band[] = [
  { min: 12, label: 'Excelente', tone: 'good' },
  { min: 9, label: 'Ótimo', tone: 'good' },
  { min: 7, label: 'Bom', tone: 'blue' },
  { min: 5, label: 'Regular', tone: 'warn' },
  { min: 2, label: 'Ruim', tone: 'bad' },
  { min: -Infinity, label: 'Horrível', tone: 'bad' },
];

const CHECKOUT_CONV: Band[] = [
  { min: 40, label: 'Excelente', tone: 'good' },
  { min: 32, label: 'Ótimo', tone: 'good' },
  { min: 26, label: 'Bom', tone: 'blue' },
  { min: 21, label: 'Regular', tone: 'warn' },
  { min: 18, label: 'Ruim', tone: 'bad' },
  { min: -Infinity, label: 'Horrível', tone: 'bad' },
];

export const rateConnectRate = (v: number) => classifyDesc(v, CONNECT_RATE);
export const rateCtr = (v: number) => classifyDesc(v, CTR);
export const rateSalesPageConv = (v: number) => classifyDesc(v, SALES_PAGE_CONV);
export const rateCheckoutConv = (v: number) => classifyDesc(v, CHECKOUT_CONV);

// CPM: MENOR é melhor — leitura de competitividade do nicho.
export function rateCpm(v: number): Rating {
  if (v <= 0) return { label: '—', tone: 'good' };
  if (v <= 20) return { label: 'Nicho excelente', tone: 'good' };
  if (v <= 40) return { label: 'Nicho ótimo', tone: 'good' };
  if (v <= 60) return { label: 'Nicho bom', tone: 'blue' };
  if (v <= 80) return { label: 'Nicho concorrido', tone: 'warn' };
  if (v <= 110) return { label: 'Nicho muito concorrido', tone: 'warn' };
  return { label: 'Nicho extremamente concorrido', tone: 'bad' };
}
