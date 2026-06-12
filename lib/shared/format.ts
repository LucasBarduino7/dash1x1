// Formatadores BRL, %, datas — locale pt-BR

export function brl(value: number, opts?: { compact?: boolean }): string {
  if (!isFinite(value) || isNaN(value)) return 'R$ —';
  if (opts?.compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      notation: 'compact',
      maximumFractionDigits: 1,
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function pct(value: number, decimals = 1): string {
  if (!isFinite(value) || isNaN(value)) return '—';
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

export function num(value: number, opts?: { compact?: boolean }): string {
  if (!isFinite(value) || isNaN(value)) return '—';
  if (opts?.compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('pt-BR').format(Math.round(value));
}

export function formatDateBR(iso: string): string {
  // iso = "2026-05-14"
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function formatDayMonthBR(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}
