// Lê a planilha de leads (XLSX) do Google Sheets preservando cores
// Foco: aba "Maio". Cor da célula = status do lead.

import ExcelJS from 'exceljs';
import type { Lead, LeadStats, LeadStatus } from './types';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const DEFAULT_SHEET_TAB = process.env.GOOGLE_SHEET_TAB || 'Maio';

// Mapeamento de cor → status, baseado na análise da planilha:
// 🔴 vermelho → desqualificado (sem agência, sem dinheiro, número errado, etc.)
// 🟡 amarelo → tem agência
// 🟢 verde (qualquer tom) → agendado
// 🟣 roxo → dono de agência sem faturamento pra entrar no Scale
// 🔵 azul → separador de dias (ignorar)
// ⚪ sem cor → ainda não contactado

const RED_HEX = new Set([
  'FFEA9999', // vermelho claro principal
  'FFA61C00', // vermelho escuro
  'FFCC0000',
  'FFE06666',
  'FF990000',
]);
const YELLOW_HEX = new Set([
  'FFFFE599', // amarelo claro principal
  'FFFFD966',
  'FFF1C232',
]);
const GREEN_HEX = new Set([
  'FF6AA84F', // verde escuro
  'FF93C47D', // verde claro
  'FFB6D7A8', // verde mais claro
  'FF38761D',
  'FF274E13',
]);
const BLUE_HEX = new Set([
  'FF4A86E8',
  'FF6D9EEB',
  'FF3C78D8',
  'FFA4C2F4',
  'FF1155CC',
]);
const PURPLE_HEX = new Set([
  'FFD9D2E9', // roxo claro 3
  'FFB4A7D6', // roxo claro 2
  'FF8E7CC3', // roxo claro 1
  'FF674EA7', // roxo
  'FF351C75', // roxo escuro 1
  'FF20124D', // roxo escuro 2
]);

function classifyByColor(rgb: string | null | undefined): LeadStatus {
  if (!rgb) return 'nao_contactado';
  const up = rgb.toUpperCase();
  if (RED_HEX.has(up)) return 'desqualificado';
  if (YELLOW_HEX.has(up)) return 'tem_agencia';
  if (GREEN_HEX.has(up)) return 'agendado';
  if (PURPLE_HEX.has(up)) return 'dono_sem_faturamento';
  if (BLUE_HEX.has(up)) return 'separador';

  // Fallback: classificar por componente RGB dominante
  // Hex format: AARRGGBB (8 chars)
  if (up.length === 8) {
    const r = parseInt(up.slice(2, 4), 16);
    const g = parseInt(up.slice(4, 6), 16);
    const b = parseInt(up.slice(6, 8), 16);
    // Branco / muito claro → não contactado
    if (r > 240 && g > 240 && b > 240) return 'nao_contactado';
    // Roxo: vermelho e azul ambos relevantes, verde menor — testar ANTES do azul
    if (b > 120 && r > 80 && b > g + 20 && r > g && Math.abs(r - b) < 90) {
      return 'dono_sem_faturamento';
    }
    // Azul dominante
    if (b > 180 && b > r + 40 && b > g + 20) return 'separador';
    // Vermelho dominante
    if (r > 150 && r > g + 40 && r > b + 30) return 'desqualificado';
    // Amarelo
    if (r > 200 && g > 180 && b < 180) return 'tem_agencia';
    // Verde dominante
    if (g > 130 && g > r && g > b) return 'agendado';
  }
  return 'nao_contactado';
}

function dateToISO(d: Date): string {
  if (!d || isNaN(d.getTime())) return '';
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Tenta extrair data ISO (yyyy-mm-dd) de um timestamp da planilha. */
function parseDate(raw: unknown): string {
  if (raw == null) return '';
  // ExcelJS pode devolver Date direto (Google Forms timestamp normalmente vira Date)
  if (raw instanceof Date) return dateToISO(raw);
  // Pode vir como objeto rico do ExcelJS (ex.: { richText: [...] } ou { result, formula })
  if (typeof raw === 'object') {
    const r = raw as { result?: unknown; text?: unknown };
    if (r.result instanceof Date) return dateToISO(r.result);
    if (typeof r.result === 'string' || typeof r.result === 'number') return parseDate(r.result);
    if (typeof r.text === 'string') return parseDate(r.text);
  }
  const s = String(raw).trim();
  if (!s) return '';
  // dd/mm/yyyy (hh:mm:ss opcional)
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    let yyyy = m[3];
    if (yyyy.length === 2) yyyy = '20' + yyyy;
    return `${yyyy}-${mm}-${dd}`;
  }
  // ISO yyyy-mm-dd
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // Serial number do Excel
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

async function downloadXlsx(): Promise<ArrayBuffer> {
  // Cache-buster: força a CDN do Google a devolver versão fresca em vez do XLSX cacheado.
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx&_=${Date.now()}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
  if (!res.ok) {
    throw new Error(`Falha ao baixar planilha: HTTP ${res.status}`);
  }
  return await res.arrayBuffer();
}

export async function fetchLeads(sheetTab: string = DEFAULT_SHEET_TAB): Promise<Lead[]> {
  const buffer = await downloadXlsx();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // Encontra a aba do mês (case-insensitive)
  const target = sheetTab.toLowerCase();
  const sheet = workbook.worksheets.find((ws) => ws.name.toLowerCase() === target);
  if (!sheet) {
    const names = workbook.worksheets.map((w) => w.name).join(', ');
    throw new Error(`Aba "${sheetTab}" não encontrada. Abas disponíveis: ${names}`);
  }

  const leads: Lead[] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    // Colunas: 1=timestamp, 2=email, 3=phone, 4=faturamento, 5=nome, 6=status_texto
    const timestampRaw = row.getCell(1).value;
    const timestamp = (timestampRaw ?? '').toString().trim();
    const email = (row.getCell(2).value ?? '').toString().trim();
    const phone = (row.getCell(3).value ?? '').toString().trim();
    const faturamento = (row.getCell(4).value ?? '').toString().trim();
    const nome = (row.getCell(5).value ?? '').toString().trim();
    const observacao = (row.getCell(6).value ?? '').toString().trim();

    // Cor de fundo da linha (usar coluna A como referência — sempre pintada)
    const fill = row.getCell(1).fill as ExcelJS.FillPattern | undefined;
    let rgb: string | undefined;
    if (fill?.fgColor?.argb) rgb = fill.fgColor.argb;

    const status = classifyByColor(rgb);

    // Ignora separadores (azul) e linhas sem timestamp
    if (status === 'separador') return;
    if (!timestamp && !email) return;

    leads.push({
      email,
      phone,
      faturamento,
      nome,
      observacao,
      status,
      date: parseDate(timestampRaw),
      colorHex: rgb || 'none',
    });
  });

  return leads;
}

/** Filtra leads por período (inclusivo). Leads sem date são preservados. */
export function filterLeadsByPeriod(
  leads: Lead[],
  since: string,
  until: string,
): Lead[] {
  return leads.filter((l) => {
    if (!l.date) return false;
    return l.date >= since && l.date <= until;
  });
}

export function computeLeadStats(leads: Lead[]): LeadStats {
  const total = leads.length;
  const agendados = leads.filter((l) => l.status === 'agendado').length;
  const temAgencia = leads.filter((l) => l.status === 'tem_agencia').length;
  const donoSemFaturamento = leads.filter((l) => l.status === 'dono_sem_faturamento').length;
  const desqualificados = leads.filter((l) => l.status === 'desqualificado').length;
  const naoContactados = leads.filter((l) => l.status === 'nao_contactado').length;
  const qualificados = agendados + temAgencia + donoSemFaturamento;

  return {
    total,
    agendados,
    temAgencia,
    donoSemFaturamento,
    desqualificados,
    naoContactados,
    qualificados,
    taxaQualificacao: total > 0 ? (qualificados / total) * 100 : 0,
    taxaAgendamento: qualificados > 0 ? (agendados / qualificados) * 100 : 0,
  };
}
