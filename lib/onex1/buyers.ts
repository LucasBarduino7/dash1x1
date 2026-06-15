// Cruza lista de compradores com leads das duas planilhas.
// Match por: telefone normalizado → email → nome (fuzzy fallback).

import type { Buyer } from '@/data/buyers-maio';
import type { SalesOverrides } from './months';
import type { BuyerMatch, LeadStatus, RawLead, SalesData } from './types';

/** Tira tudo que não é dígito e pega os últimos 11 dígitos (DDD + número). */
export function normalizePhone(s: string): string {
  if (!s) return '';
  const digits = s.replace(/\D+/g, '');
  if (digits.length < 8) return '';
  // Pega os últimos 11 dígitos (descarta DDI 55 e variações com/sem 9º)
  return digits.slice(-11);
}

/** Versão de 10 dígitos (sem 9º dígito) — pra cobrir números antigos. */
function normalizePhone10(s: string): string {
  const n = normalizePhone(s);
  if (n.length === 11 && n[2] === '9') return n.slice(0, 2) + n.slice(3); // remove 9º
  return n.length === 10 ? n : '';
}

export function normalizeEmail(s: string): string {
  return (s || '').trim().toLowerCase();
}

/** Normaliza nome: lowercase, sem acentos, sem caracteres especiais, sem espaços extras. */
export function normalizeName(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Similaridade Jaccard simples sobre tokens (palavras). */
function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  const ta = new Set(na.split(' ').filter((w) => w.length >= 3));
  const tb = new Set(nb.split(' ').filter((w) => w.length >= 3));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return inter / union;
}

type LeadRef = { email: string; phone: string; instagram?: string; status?: LeadStatus };

/** Indexa SOMENTE leads de campanhas 1x1 (planilha de origem — maio + histórico). */
function buildIndexes(leads1x1: RawLead[]): {
  byPhone: Map<string, LeadRef>;
  byPhone10: Map<string, LeadRef>;
  byEmail: Map<string, LeadRef>;
  all: LeadRef[];
} {
  const byPhone = new Map<string, LeadRef>();
  const byPhone10 = new Map<string, LeadRef>();
  const byEmail = new Map<string, LeadRef>();
  const all: LeadRef[] = [];

  for (const r of leads1x1) {
    const ref: LeadRef = { email: r.email, phone: r.phone, instagram: r.instagram };
    all.push(ref);
    const p = normalizePhone(ref.phone);
    if (p) byPhone.set(p, ref);
    const p10 = normalizePhone10(ref.phone);
    if (p10) byPhone10.set(p10, ref);
    const e = normalizeEmail(ref.email);
    if (e) byEmail.set(e, ref);
  }

  return { byPhone, byPhone10, byEmail, all };
}

function findMatch(
  buyer: Buyer,
  idx: ReturnType<typeof buildIndexes>,
): { matchType: BuyerMatch['matchType']; leadStatus?: LeadStatus } {
  // 1) Telefone (11 dígitos)
  const bp = normalizePhone(buyer.telefone);
  if (bp && idx.byPhone.has(bp)) return { matchType: 'phone' };
  // 1.5) Telefone (10 dígitos — sem 9º dígito)
  const bp10 = normalizePhone10(buyer.telefone);
  if (bp10 && idx.byPhone10.has(bp10)) return { matchType: 'phone' };
  // 2) Email
  const be = normalizeEmail(buyer.email);
  if (be && idx.byEmail.has(be)) return { matchType: 'email' };
  // 3) Nome (fuzzy ≥ 0.6 contra email-username e instagram dos leads)
  if (buyer.nome) {
    let bestSim = 0;
    for (const l of idx.all) {
      const igSim = nameSimilarity(buyer.nome, l.instagram || '');
      const emailUser = (l.email || '').split('@')[0];
      const eSim = nameSimilarity(buyer.nome, emailUser);
      const sim = Math.max(igSim, eSim);
      if (sim > bestSim) bestSim = sim;
    }
    if (bestSim >= 0.6) return { matchType: 'name' };
  }
  return { matchType: 'none' };
}

export function computeSales(
  /** Leads de campanhas 1x1 (aba do mês + histórico filtrado). É a única fonte da verdade. */
  leads1x1: RawLead[],
  investmentTotal: number,
  opts: {
    /** Lista de compradores do mês selecionado. */
    buyers: Buyer[];
    /** Overrides manuais do mês selecionado. */
    overrides: SalesOverrides;
    /** Filtra compradores por data de venda (yyyy-mm-dd inclusivo). */
    period?: { since: string; until: string };
    /** True quando o período é menor que o mês — overrides mensais não se aplicam. */
    isSubperiod?: boolean;
  },
): SalesData {
  const idx = buildIndexes(leads1x1);
  const { buyers: monthBuyers, overrides } = opts;

  // Filtra compradores pelo período (quando definido).
  const buyersPool = opts.period
    ? monthBuyers.filter(
        (b) =>
          b.date && b.date >= opts.period!.since && b.date <= opts.period!.until,
      )
    : monthBuyers;

  const buyers: BuyerMatch[] = buyersPool.map((b) => {
    // Override manual tem prioridade
    if (b.is1x1 === true) {
      return {
        buyerId: b.id,
        apelido: b.apelido,
        nome: b.nome,
        plano: b.plano,
        date: b.date,
        recebidoMaio: b.recebidoMaio,
        total: b.total,
        is1x1: true,
        matchType: 'override',
        faturamento: b.faturamento,
      };
    }
    if (b.is1x1 === false) {
      return {
        buyerId: b.id,
        apelido: b.apelido,
        nome: b.nome,
        plano: b.plano,
        date: b.date,
        recebidoMaio: b.recebidoMaio,
        total: b.total,
        is1x1: false,
        matchType: 'override',
        faturamento: b.faturamento,
      };
    }
    // Auto match
    const m = findMatch(b, idx);
    return {
      buyerId: b.id,
      apelido: b.apelido,
      nome: b.nome,
      plano: b.plano,
      date: b.date,
      recebidoMaio: b.recebidoMaio,
      total: b.total,
      is1x1: m.matchType !== 'none',
      matchType: m.matchType,
      leadStatus: m.leadStatus,
      faturamento: b.faturamento,
    };
  });

  const buyers1x1 = buyers.filter((b) => b.is1x1);

  // Overrides são manuais e mensais — só se aplicam quando o período é o mês inteiro.
  const useOverrides = !opts.isSubperiod;
  const faturamento1x1 = useOverrides
    ? overrides.faturamento1x1 ?? buyers1x1.reduce((acc, b) => acc + b.recebidoMaio, 0)
    : buyers1x1.reduce((acc, b) => acc + b.recebidoMaio, 0);
  const totalBrutoMes = useOverrides
    ? overrides.faturamentoBrutoMes ?? buyers.reduce((acc, b) => acc + b.recebidoMaio, 0)
    : buyers.reduce((acc, b) => acc + b.recebidoMaio, 0);
  const totalVendas = useOverrides
    ? overrides.vendas1x1 ?? buyers1x1.length
    : buyers1x1.length;
  const ticketMedio = totalVendas > 0 ? faturamento1x1 / totalVendas : 0;
  const cac = totalVendas > 0 ? investmentTotal / totalVendas : 0;
  const roas = investmentTotal > 0 ? faturamento1x1 / investmentTotal : 0;

  // Reuniões realizadas: override (mensal) só vale no mês completo. Em sub-período não temos dado granular.
  const reunioesRealizadas = useOverrides ? overrides.reunioesRealizadas ?? 0 : 0;
  const custoPorRealizada = reunioesRealizadas > 0 ? investmentTotal / reunioesRealizadas : 0;
  const taxaConversao = reunioesRealizadas > 0 ? (totalVendas / reunioesRealizadas) * 100 : 0;

  return {
    totalVendas,
    totalBrutoMes,
    faturamento1x1,
    ticketMedio,
    cac,
    roas,
    reunioesRealizadas,
    custoPorRealizada,
    taxaConversao,
    buyers,
  };
}
