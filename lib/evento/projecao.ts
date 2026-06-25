// Projeção da Alavanca — Evento Presencial.
// Calcula meta total, pace diário e realizado vs esperado até hoje, com status
// por linha. Tudo vem dos JSONs (data/projecao_evento.json + data/dados_diarios.json)
// e do funil manual (EVENTO.funil em data/evento.ts). Métricas de mídia (CPM/CTR/
// CPL/leads/investimento) usam a Meta ao vivo quando disponível, com fallback
// pro dados_diarios.json. Nenhum número fica hardcoded aqui.

import PROJ from '@/data/projecao_evento.json';
import DIARIOS from '@/data/dados_diarios.json';
import { EVENTO } from '@/data/evento';
import type { EventoMeta } from '@/lib/evento/meta';

export type Status = 'good' | 'warn' | 'bad' | 'neutral';
export type RowFormat = 'brl' | 'pct' | 'num';

export type ProjecaoRow = {
  key: string;
  label: string;
  format: RowFormat;
  metaTotal: number;
  /** Esperado acumulado até hoje (pace). null = métrica de taxa ou sem campanha. */
  esperado: number | null;
  realizado: number | null;
  /** Score normalizado onde >=1 significa "no/acima do alvo" (já invertido p/ custo). */
  score: number | null;
  status: Status;
  /** true = quanto menor melhor (custo). */
  menorMelhor: boolean;
};

export type ProjecaoData = {
  configurada: boolean; // datas + preço preenchidos
  diasCampanha: number;
  diasDecorridos: number;
  progresso: number; // 0..1
  dataInicio: string;
  dataFim: string;
  precoVenda: number;
  // KPIs de topo
  vendasRealizado: number;
  vendasMeta: number;
  cacAtual: number | null;
  cacMeta: number;
  custoReuniaoAtual: number | null;
  custoReuniaoMeta: number;
  roasAtual: number | null;
  roasMeta: number | null;
  investimentoRealizado: number;
  rows: ProjecaoRow[];
};

type Diario = { data: string; investimento?: number; leads?: number };

function hojeSP(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}
/** Dias inclusivos entre duas datas ISO (b - a + 1). */
function diasInclusivos(a: string, b: string): number {
  const da = new Date(`${a}T12:00:00`).getTime();
  const db = new Date(`${b}T12:00:00`).getTime();
  return Math.floor((db - da) / 86400000) + 1;
}

function statusDoScore(score: number | null): Status {
  if (score == null) return 'neutral';
  if (score >= 1) return 'good';
  if (score >= 0.8) return 'warn';
  return 'bad';
}

export function getProjecao(meta: EventoMeta | null): ProjecaoData {
  const diarios = DIARIOS as Diario[];
  const somaInvest = diarios.reduce((acc, d) => acc + (d.investimento || 0), 0);
  const somaLeads = diarios.reduce((acc, d) => acc + (d.leads || 0), 0);

  const temMeta = !!meta && meta.hasData;

  // Realizados de mídia: Meta ao vivo > fallback manual (dados_diarios).
  const investimentoRealizado = temMeta && meta!.spend > 0 ? meta!.spend : somaInvest;
  const leadsRealizado = temMeta && meta!.leads > 0 ? meta!.leads : somaLeads;
  const cpmRealizado = temMeta && meta!.impressions > 0 ? meta!.cpm : null;
  const ctrRealizado = temMeta && meta!.impressions > 0 ? meta!.ctr : null;
  const cplRealizado =
    temMeta && meta!.leads > 0
      ? meta!.cpl
      : leadsRealizado > 0
        ? investimentoRealizado / leadsRealizado
        : null;

  // Funil real (manual) — data/evento.ts.
  const agendRealizado = EVENTO.funil.agendamentos;
  const realizRealizado = EVENTO.funil.realizadas;
  const vendasRealizado = EVENTO.funil.vendas;

  // Janela da campanha.
  const dataInicio = PROJ.data_inicio || '';
  const dataFim = PROJ.data_fim || '';
  const configurada = !!(dataInicio && dataFim && PROJ.preco_venda > 0);
  const temDatas = !!(dataInicio && dataFim);

  const diasCampanha = temDatas ? Math.max(1, diasInclusivos(dataInicio, dataFim)) : 0;
  const diasDecorridos = temDatas
    ? Math.min(diasCampanha, Math.max(0, diasInclusivos(dataInicio, hojeSP())))
    : 0;
  const progresso = diasCampanha > 0 ? Math.min(1, diasDecorridos / diasCampanha) : 0;

  // Esperado acumulado p/ métrica de volume (pace).
  const esperadoVol = (total: number): number | null =>
    diasCampanha > 0 ? (total / diasCampanha) * diasDecorridos : null;

  // Linha de VOLUME (maior melhor): score = realizado / esperado.
  const rowVolume = (
    key: string,
    label: string,
    format: RowFormat,
    metaTotal: number,
    realizado: number | null,
    neutra = false,
  ): ProjecaoRow => {
    const esperado = esperadoVol(metaTotal);
    const score = esperado && esperado > 0 && realizado != null ? realizado / esperado : null;
    return {
      key,
      label,
      format,
      metaTotal,
      esperado,
      realizado,
      score,
      status: neutra ? 'neutral' : statusDoScore(score),
      menorMelhor: false,
    };
  };

  // Linha de TAXA/CUSTO: esperado = a própria meta (constante).
  // menorMelhor: score = meta / realizado · maiorMelhor (CTR): score = realizado / meta.
  const rowTaxa = (
    key: string,
    label: string,
    format: RowFormat,
    metaTotal: number,
    realizado: number | null,
    menorMelhor: boolean,
  ): ProjecaoRow => {
    let score: number | null = null;
    if (realizado != null && realizado > 0 && metaTotal > 0) {
      score = menorMelhor ? metaTotal / realizado : realizado / metaTotal;
    }
    return {
      key,
      label,
      format,
      metaTotal,
      esperado: metaTotal,
      realizado,
      score,
      status: statusDoScore(score),
      menorMelhor,
    };
  };

  const rows: ProjecaoRow[] = [
    rowVolume('investimento', 'Investimento', 'brl', PROJ.investimento_total, investimentoRealizado, true),
    rowTaxa('cpm', 'CPM', 'brl', PROJ.cpm_teto, cpmRealizado, true),
    rowTaxa('ctr', 'CTR', 'pct', PROJ.ctr_piso, ctrRealizado, false),
    rowTaxa('cpl', 'CPL', 'brl', PROJ.cpl_meta, cplRealizado, true),
    rowVolume('leads', 'Leads', 'num', PROJ.leads_meta, leadsRealizado),
    rowVolume('agendamentos', 'Agendamentos', 'num', PROJ.agendamentos_meta, agendRealizado),
    rowVolume('realizadas', 'Realizadas', 'num', PROJ.realizadas_meta, realizRealizado),
    rowVolume('vendas', 'Vendas', 'num', PROJ.vendas_meta, vendasRealizado),
  ];

  const cacAtual = vendasRealizado > 0 ? investimentoRealizado / vendasRealizado : null;
  const custoReuniaoAtual = realizRealizado > 0 ? investimentoRealizado / realizRealizado : null;
  const roasAtual =
    PROJ.preco_venda > 0 && investimentoRealizado > 0
      ? (vendasRealizado * PROJ.preco_venda) / investimentoRealizado
      : null;
  // Meta de ROAS implícita: (vendas_meta × preço) ÷ investimento_total.
  const roasMeta =
    PROJ.preco_venda > 0 && PROJ.investimento_total > 0
      ? (PROJ.vendas_meta * PROJ.preco_venda) / PROJ.investimento_total
      : null;

  return {
    configurada,
    diasCampanha,
    diasDecorridos,
    progresso,
    dataInicio,
    dataFim,
    precoVenda: PROJ.preco_venda,
    vendasRealizado,
    vendasMeta: PROJ.vendas_meta,
    cacAtual,
    cacMeta: PROJ.cac_meta,
    custoReuniaoAtual,
    custoReuniaoMeta: PROJ.custo_por_reuniao_meta,
    roasAtual,
    roasMeta,
    investimentoRealizado,
    rows,
  };
}

export type { EventoMeta };
