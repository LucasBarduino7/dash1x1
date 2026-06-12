// Registro de meses do dashboard.
// Cada mês conhece seu período, as abas das duas planilhas, a lista de
// compradores e os overrides manuais. Adicionar um mês novo = adicionar uma
// entrada aqui + os arquivos data/buyers-<mes>.ts e data/overrides-<mes>.ts.

import type { Buyer } from '@/data/buyers-maio';
import { COMPRADORES_MAIO } from '@/data/buyers-maio';
import { SALES_OVERRIDES as OVERRIDES_MAIO } from '@/data/overrides-maio';
import { COMPRADORES_JUNHO } from '@/data/buyers-junho';
import { SALES_OVERRIDES as OVERRIDES_JUNHO } from '@/data/overrides-junho';

export type SalesOverrides = {
  faturamento1x1?: number;
  faturamentoBrutoMes?: number;
  vendas1x1?: number;
  reunioesRealizadas?: number;
};

export type MonthConfig = {
  /** Chave usada na URL (?month=...) */
  key: string;
  /** Rótulo exibido na navegação (ex.: "JUNHO/2026") */
  label: string;
  /** Início do mês (ISO yyyy-mm-dd, inclusivo) */
  since: string;
  /** Fim do mês (ISO yyyy-mm-dd, inclusivo) */
  until: string;
  /** Aba da planilha de qualificação por cor (planilha 1) */
  sheetTab: string;
  /** Aba da planilha automatizada de origem (planilha 2 — IDs de campanha/conjunto/anúncio).
   *  É um tab rolante que acumula os leads por data; o filtro de período corta o mês. */
  rawSheetTab: string;
  /** Compradores do mês */
  buyers: Buyer[];
  /** Overrides manuais do mês */
  overrides: SalesOverrides;
};

// A planilha de origem (MM) é um tab rolante único — os dois meses leem o
// mesmo tab e o filtro por data separa cada mês.
const RAW_TAB = process.env.GOOGLE_SHEET_RAW_TAB || 'MM OFICIAL [MAI/2026]';

export const MONTHS: MonthConfig[] = [
  {
    key: 'junho-2026',
    label: 'JUNHO/2026',
    since: '2026-06-01',
    until: '2026-06-30',
    sheetTab: 'Junho',
    rawSheetTab: RAW_TAB,
    buyers: COMPRADORES_JUNHO,
    overrides: OVERRIDES_JUNHO,
  },
  {
    key: 'maio-2026',
    label: 'MAIO/2026',
    since: '2026-05-01',
    until: '2026-05-31',
    sheetTab: 'Maio',
    rawSheetTab: RAW_TAB,
    buyers: COMPRADORES_MAIO,
    overrides: OVERRIDES_MAIO,
  },
];

export const DEFAULT_MONTH_KEY = 'junho-2026';

export function getMonth(key?: string): MonthConfig {
  return (
    MONTHS.find((m) => m.key === key) ??
    MONTHS.find((m) => m.key === DEFAULT_MONTH_KEY) ??
    MONTHS[0]
  );
}
