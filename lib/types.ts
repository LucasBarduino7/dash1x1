// Tipos compartilhados do dashboard

export type LeadStatus = 'agendado' | 'tem_agencia' | 'desqualificado' | 'nao_contactado' | 'separador';

export type Lead = {
  email: string;
  phone: string;
  faturamento: string;
  nome: string;
  observacao: string;
  status: LeadStatus;
  /** Cor hex original (debug) */
  colorHex: string;
};

/** Lead bruto vindo da planilha automatizada (com origem Meta) */
export type RawLead = {
  email: string;
  phone: string;
  faturamento: string;
  instagram: string;
  /** ID do Meta — pode estar sujo (status no lugar) */
  campaignId: string;
  /** ID do conjunto no Meta — chave de cruzamento */
  adsetId: string;
  /** ID do anúncio (geralmente vazio na fonte atual) */
  adId: string;
  date: string; // ISO yyyy-mm-dd
};

/** Lead consolidado: cruza qualificação (cor) + origem (conjunto) */
export type EnrichedLead = {
  email: string;
  campaignId: string;
  adsetId: string;
  adId: string;
  status: LeadStatus;
  date: string;
};

export type LeadStats = {
  total: number;
  agendados: number;
  temAgencia: number;
  desqualificados: number;
  naoContactados: number;
  /** Donos de agência = agendados + temAgencia */
  qualificados: number;
  /** % qualificados sobre o total */
  taxaQualificacao: number;
  /** % agendados sobre qualificados */
  taxaAgendamento: number;
};

// --- Meta Ads ---

export type MetaAction = {
  action_type: string;
  value: string;
};

export type MetaInsight = {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend: string;
  impressions: string;
  reach: string;
  clicks: string;
  cpm: string;
  cpc: string;
  ctr: string;
  inline_link_clicks?: string;
  cost_per_inline_link_click?: string;
  actions?: MetaAction[];
  cost_per_action_type?: MetaAction[];
  date_start: string;
  date_stop: string;
};

export type CampaignRow = {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  linkClicks: number;
  landingPageViews: number;
  leads: number; // leads brutos do Meta (pixel + onsite)
  /** Connect rate = LP views / link clicks */
  connectRate: number;
  /** CPL bruto (do Meta) */
  cpl: number;
};

/** Linha de ranqueamento por conjunto/anúncio com qualificação cruzada */
export type RankedRow = {
  id: string;
  name: string;
  /** Métricas do Meta */
  spend: number;
  impressions: number;
  clicks: number;
  linkClicks: number;
  landingPageViews: number;
  cpm: number;
  ctr: number;
  /** Métricas da planilha (cruzada por email) */
  leadsTotal: number;
  agendados: number;
  temAgencia: number;
  desqualificados: number;
  qualificados: number; // agendados + temAgencia
  /** Derivadas */
  taxaQualificacao: number; // % qualificados / total
  cplQualificado: number; // spend / qualificados
  custoPorReuniao: number; // spend / agendados
};

export type BreakdownRow = {
  key: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  leads: number;
};

// --- Dashboard agregado ---

export type DashboardData = {
  period: { since: string; until: string };
  meta: {
    spendTotal: number;
    impressions: number;
    reach: number;
    clicks: number;
    linkClicks: number;
    landingPageViews: number;
    leadsMeta: number; // leads brutos do Meta
    cpm: number;
    cpc: number;
    ctr: number;
    cplMeta: number;
    connectRate: number;
  };
  leads: LeadStats;
  /** Qualificação total cruzada com investimento */
  qualif: {
    custoPorLeadQualificado: number; // gasto / qualificados
    custoPorReuniao: number; // gasto / agendados
  };
  campaigns: CampaignRow[];
  /** Ranking de conjuntos cruzados com qualificação */
  adsetsRanked: RankedRow[];
  /** Ranking de anúncios/criativos cruzados com qualificação */
  adsRanked: RankedRow[];
  ageBreakdown: BreakdownRow[];
  /** Distribuição estimada de idade dos donos de agência (qualificados) */
  qualifiedAgeBreakdown: { key: string; qualif: number }[];
  regionBreakdown: BreakdownRow[];
  dailyTimeline: { date: string; spend: number; leads: number }[];
  /** Vendas, CAC e ROAS */
  sales: SalesData;
  /** Alertas/avisos sobre os dados (ex: leads não cruzados) */
  warnings: string[];
};

export type BuyerMatch = {
  buyerId: string;
  apelido: string;
  nome: string;
  plano: string;
  date: string;
  recebidoMaio: number;
  total: number;
  is1x1: boolean;
  /** Como bateu (phone/email/name/override/none) */
  matchType: 'phone' | 'email' | 'name' | 'override' | 'none';
  /** Status do lead encontrado (quando matched) */
  leadStatus?: LeadStatus;
};

export type SalesData = {
  totalVendas: number; // qtd vendas 1x1
  totalBrutoMes: number; // soma recebidoMaio de TODOS compradores (referência)
  faturamento1x1: number; // soma recebidoMaio de vendas 1x1
  ticketMedio: number;
  cac: number; // investimento / vendas 1x1
  roas: number; // faturamento 1x1 / investimento
  /** Calls/reuniões realizadas no mês (override do usuário) */
  reunioesRealizadas: number;
  /** Custo por reunião realizada = investimento / realizadas */
  custoPorRealizada: number;
  /** Taxa de conversão = vendas 1x1 / realizadas */
  taxaConversao: number;
  buyers: BuyerMatch[];
};
