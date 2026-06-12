// Cliente Kiwify Public API — SOMENTE LEITURA.
// Fluxo: OAuth (client_id/secret) → token Bearer → GET /v1/sales (status=paid).
// Order bumps no Kiwify são produtos próprios: classificamos por product_id.
//
// Docs: https://docs.kiwify.com.br/api-reference
//   POST https://public-api.kiwify.com/v1/oauth/token  (x-www-form-urlencoded)
//   GET  https://public-api.kiwify.com/v1/sales         (header x-kiwify-account-id)

import type { KiwifyData, KiwifySale } from './types';

const CLIENT_ID = process.env.KIWIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.KIWIFY_CLIENT_SECRET;
const ACCOUNT_ID = process.env.KIWIFY_ACCOUNT_ID;
const BASE = 'https://public-api.kiwify.com/v1';

/**
 * Valores da API do Kiwify vêm em centavos (ex: 9700 = R$ 97,00).
 * Se na sua conta vierem em reais, defina KIWIFY_AMOUNT_IN_CENTS=false.
 */
const AMOUNT_IN_CENTS = (process.env.KIWIFY_AMOUNT_IN_CENTS ?? 'true') !== 'false';

function parseIdSet(raw?: string): Set<string> {
  return new Set(
    (raw || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

const TICKET_IDS = parseIdSet(process.env.KIWIFY_TICKET_PRODUCT_IDS);
const BUMP_IDS = parseIdSet(process.env.KIWIFY_ORDERBUMP_PRODUCT_IDS);

export function kiwifyConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET && ACCOUNT_ID);
}

function parseAmount(v: unknown): number {
  const n = Number(v) || 0;
  return AMOUNT_IN_CENTS ? n / 100 : n;
}

// A Kiwify devolve timestamps em UTC. O dashboard (e o painel da Kiwify) raciocinam
// em horário de Brasília, então convertemos antes de cortar o dia — senão vendas
// após 21h BRT contam no dia seguinte e bagunçam a contagem diária e as bordas do período.
const brtDateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function toBrtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return brtDateFmt.format(d); // YYYY-MM-DD
}

// --- token (cache em memória, dura ~24h) ---
let tokenCache: { token: string; exp: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.exp) return tokenCache.token;

  const body = new URLSearchParams({
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
  });
  const res = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Kiwify OAuth ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in?: number };
  const ttl = (Number(json.expires_in) || 3600) - 60;
  tokenCache = { token: json.access_token, exp: Date.now() + ttl * 1000 };
  return tokenCache.token;
}

async function kiwifyGet(path: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const token = await getToken();
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-kiwify-account-id': ACCOUNT_ID!,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Kiwify API ${res.status}: ${t.slice(0, 200)}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

type RawSale = {
  id?: string;
  status?: string;
  created_at?: string;
  approved_date?: string;
  net_amount?: number | string;
  payment_method?: string;
  product?: { id?: string; name?: string };
  customer?: { name?: string };
  payment?: { charge_amount?: number | string; method?: string };
};

function classify(productId: string): boolean {
  // true = order bump
  return BUMP_IDS.has(productId);
}

function isTicket(productId: string): boolean {
  // Se TICKET_IDS não foi definido, todo produto que não é bump conta como ingresso.
  if (TICKET_IDS.size === 0) return !BUMP_IDS.has(productId);
  return TICKET_IDS.has(productId);
}

export function emptyKiwifyData(): KiwifyData {
  return {
    ingressos: 0,
    faturamentoIngressos: 0,
    orderbumps: 0,
    faturamentoOrderbumps: 0,
    faturamentoTotal: 0,
    ticketMedio: 0,
    timeline: [],
    sales: [],
  };
}

export async function fetchKiwifyData(period: {
  since: string;
  until: string;
}): Promise<KiwifyData> {
  if (!kiwifyConfigured()) {
    throw new Error(
      'Kiwify não configurado. Defina KIWIFY_CLIENT_ID, KIWIFY_CLIENT_SECRET e KIWIFY_ACCOUNT_ID.',
    );
  }

  const sales: KiwifySale[] = [];
  const seen = new Set<string>(); // trava anti-duplicado por id de venda
  const pageSize = 100;
  let page = 1;

  // A Kiwify exige end_date > start_date (não aceita dia único). Buscamos um dia a mais
  // e filtramos por data no código — vale pro período inteiro e pro filtro de 1 dia.
  const endDate = (() => {
    const d = new Date(`${period.until}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  for (;;) {
    const json = await kiwifyGet('/sales', {
      status: 'paid',
      start_date: period.since,
      end_date: endDate,
      page_number: String(page),
      page_size: String(pageSize),
    });

    const rows = (json.data ?? json.sales ?? []) as RawSale[];
    for (const s of rows) {
      const id = s.id ?? '';
      if (id && seen.has(id)) continue; // ignora venda duplicada
      if (id) seen.add(id);
      const createdAt = toBrtDate(s.approved_date ?? s.created_at);
      // filtra pela janela real (já que pedimos 1 dia a mais à API)
      if (createdAt && (createdAt < period.since || createdAt > period.until)) continue;
      const productId = s.product?.id ?? '';
      sales.push({
        id,
        productId,
        productName: s.product?.name ?? '',
        amount: parseAmount(s.net_amount ?? s.payment?.charge_amount ?? 0),
        status: s.status ?? '',
        createdAt,
        isOrderBump: classify(productId),
        customerName: s.customer?.name,
        paymentMethod: s.payment_method ?? s.payment?.method,
      });
    }

    if (rows.length < pageSize) break;
    page += 1;
    if (page > 50) break; // trava de segurança (5.000 vendas)
  }

  const ingressoSales = sales.filter((s) => !s.isOrderBump && isTicket(s.productId));
  const bumpSales = sales.filter((s) => s.isOrderBump);

  const faturamentoIngressos = ingressoSales.reduce((a, s) => a + s.amount, 0);
  const faturamentoOrderbumps = bumpSales.reduce((a, s) => a + s.amount, 0);
  const ingressos = ingressoSales.length;

  // Timeline diária (ingressos + faturamento total por dia).
  const byDay = new Map<string, { ingressos: number; faturamento: number }>();
  for (const s of sales) {
    if (!s.createdAt) continue;
    const cur = byDay.get(s.createdAt) ?? { ingressos: 0, faturamento: 0 };
    if (!s.isOrderBump && isTicket(s.productId)) cur.ingressos += 1;
    cur.faturamento += s.amount;
    byDay.set(s.createdAt, cur);
  }
  const timeline = Array.from(byDay.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    ingressos,
    faturamentoIngressos,
    orderbumps: bumpSales.length,
    faturamentoOrderbumps,
    faturamentoTotal: faturamentoIngressos + faturamentoOrderbumps,
    ticketMedio: ingressos > 0 ? faturamentoIngressos / ingressos : 0,
    timeline,
    sales: sales.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
