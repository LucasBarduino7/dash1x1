// Lê a planilha de leads (XLSX) do Google Sheets preservando cores
// Foco: aba "Maio". Cor da célula = status do lead.

import ExcelJS from 'exceljs';
import type { Lead, LeadStats, LeadStatus } from './types';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || 'Maio';

// Mapeamento de cor → status, baseado na análise da planilha:
// 🔴 vermelho → desqualificado (sem agência, sem dinheiro, número errado, etc.)
// 🟡 amarelo → tem agência
// 🟢 verde (qualquer tom) → agendado
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

function classifyByColor(rgb: string | null | undefined): LeadStatus {
  if (!rgb) return 'nao_contactado';
  const up = rgb.toUpperCase();
  if (RED_HEX.has(up)) return 'desqualificado';
  if (YELLOW_HEX.has(up)) return 'tem_agencia';
  if (GREEN_HEX.has(up)) return 'agendado';
  if (BLUE_HEX.has(up)) return 'separador';

  // Fallback: classificar por componente RGB dominante
  // Hex format: AARRGGBB (8 chars)
  if (up.length === 8) {
    const r = parseInt(up.slice(2, 4), 16);
    const g = parseInt(up.slice(4, 6), 16);
    const b = parseInt(up.slice(6, 8), 16);
    // Branco / muito claro → não contactado
    if (r > 240 && g > 240 && b > 240) return 'nao_contactado';
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

async function downloadXlsx(): Promise<ArrayBuffer> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Falha ao baixar planilha: HTTP ${res.status}`);
  }
  return await res.arrayBuffer();
}

export async function fetchLeads(): Promise<Lead[]> {
  const buffer = await downloadXlsx();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // Encontra a aba "Maio" (case-insensitive)
  const target = SHEET_TAB.toLowerCase();
  const sheet = workbook.worksheets.find((ws) => ws.name.toLowerCase() === target);
  if (!sheet) {
    const names = workbook.worksheets.map((w) => w.name).join(', ');
    throw new Error(`Aba "${SHEET_TAB}" não encontrada. Abas disponíveis: ${names}`);
  }

  const leads: Lead[] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    // Colunas: 1=timestamp, 2=email, 3=phone, 4=faturamento, 5=nome, 6=status_texto
    const timestamp = (row.getCell(1).value ?? '').toString().trim();
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
      colorHex: rgb || 'none',
    });
  });

  return leads;
}

export function computeLeadStats(leads: Lead[]): LeadStats {
  const total = leads.length;
  const agendados = leads.filter((l) => l.status === 'agendado').length;
  const temAgencia = leads.filter((l) => l.status === 'tem_agencia').length;
  const desqualificados = leads.filter((l) => l.status === 'desqualificado').length;
  const naoContactados = leads.filter((l) => l.status === 'nao_contactado').length;
  const qualificados = agendados + temAgencia;

  return {
    total,
    agendados,
    temAgencia,
    desqualificados,
    naoContactados,
    qualificados,
    taxaQualificacao: total > 0 ? (qualificados / total) * 100 : 0,
    taxaAgendamento: qualificados > 0 ? (agendados / qualificados) * 100 : 0,
  };
}
