// Lê a aba rolante da planilha automatizada (ex.: "MM OFICIAL [MAI/2026]").
// O tab acumula leads de vários meses por data; o filtro de período (em
// dashboard.ts) é quem separa cada mês.
// Colunas: Data, email, Telefone, Faturamento, Instagram, Campanha (id), Conjunto (id), Anuncio (id)

import type { RawLead } from './types';

const SHEET_ID = process.env.GOOGLE_SHEET_RAW_ID!;
const DEFAULT_SHEET_TAB = process.env.GOOGLE_SHEET_RAW_TAB || 'MM OFICIAL [MAI/2026]';

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (c === '\r') {
        // skip
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function normalizeDate(raw: string): string {
  const s = (raw || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    let yyyy = m[3];
    if (yyyy.length === 2) yyyy = '20' + yyyy;
    return `${yyyy}-${mm}-${dd}`;
  }
  const num = Number(s.replace(',', '.'));
  if (Number.isFinite(num) && num > 25000 && num < 80000) {
    const epoch = Date.UTC(1899, 11, 30);
    const d = new Date(epoch + num * 86400000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return '';
}

/** Considera ID válido quando é um número longo (Meta IDs têm 14+ dígitos) */
function isValidId(v: string): boolean {
  return /^\d{14,}$/.test(v.trim());
}

export async function fetchRawLeads(sheetTab: string = DEFAULT_SHEET_TAB): Promise<RawLead[]> {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq` +
    `?tqx=out:csv&sheet=${encodeURIComponent(sheetTab)}&_=${Date.now()}`;

  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
  if (!res.ok) {
    throw new Error(
      `Falha ao baixar planilha "${sheetTab}": HTTP ${res.status}`,
    );
  }
  const text = await res.text();
  const rows = parseCsv(text);

  if (rows.length === 0) return [];
  const dataRows = rows.slice(1); // pula cabeçalho

  const leads: RawLead[] = [];
  for (const r of dataRows) {
    const date = normalizeDate(r[0] || '');
    const email = (r[1] || '').trim().toLowerCase();
    const phone = (r[2] || '').trim();
    const faturamento = (r[3] || '').trim();
    const instagram = (r[4] || '').trim();
    const rawCamp = (r[5] || '').trim();
    const rawAdset = (r[6] || '').trim();
    const rawAd = (r[7] || '').trim();

    if (!email && !phone) continue;

    leads.push({
      email,
      phone,
      faturamento,
      instagram,
      campaignId: isValidId(rawCamp) ? rawCamp : '',
      adsetId: isValidId(rawAdset) ? rawAdset : '',
      adId: isValidId(rawAd) ? rawAd : '',
      date,
    });
  }
  return leads;
}

/**
 * Lê a aba histórica padrão (1ª aba — todos os leads com nome textual de campanha)
 * e filtra apenas os leads vindos de campanhas que contêm "[1X1]" no nome.
 * Usado para o match de compradores → 1x1.
 */
export async function fetchHistoricalLeads1x1(): Promise<RawLead[]> {
  // A aba histórica é a default (sem ?sheet=) → primeira aba da planilha
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&_=${Date.now()}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
  if (!res.ok) {
    throw new Error(`Falha ao baixar histórico de leads: HTTP ${res.status}`);
  }
  const text = await res.text();
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const dataRows = rows.slice(1);

  const FILTER = '1X1';
  const leads: RawLead[] = [];
  for (const r of dataRows) {
    const campaignName = (r[5] || '').toUpperCase();
    if (!campaignName.includes(FILTER)) continue;

    const email = (r[1] || '').trim().toLowerCase();
    const phone = (r[2] || '').trim();
    if (!email && !phone) continue;

    leads.push({
      email,
      phone,
      faturamento: (r[3] || '').trim(),
      instagram: (r[4] || '').trim(),
      campaignId: '', // nome textual, não ID
      adsetId: '',
      adId: '',
      date: normalizeDate(r[0] || ''),
    });
  }
  return leads;
}
