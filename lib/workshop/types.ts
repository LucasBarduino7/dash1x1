// Tipos do dashboard do Workshop [AgênciaIA]

// --- Meta Ads ---

export type MetaAction = { action_type: string; value: string };

export type MetaInsight = {
  campaign_id?: string;
  campaign_name?: string;
  ad_name?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  cpm?: string;
  cpc?: string;
  ctr?: string;
  inline_link_clicks?: string;
  actions?: MetaAction[];
  date_start: string;
  date_stop: string;
};

export type MetaSummary = {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  linkClicks: number;
  landingPageViews: number;
  /** Checkouts iniciados (pixel) */
  initiateCheckout: number;
  /** Compras (pixel) */
  purchases: number;
  cpm: number;
  cpc: number;
  ctr: number;
  /** Connect rate = landing page views / link clicks (%) */
  connectRate: number;
  /** Conversão da página de vendas = checkouts iniciados / LP views (%) */
  salesPageConv: number;
  /** Conversão de checkout = compras / checkouts iniciados (%) */
  checkoutConv: number;
};

export type CampaignRow = {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpm: number;
  ctr: number;
  connectRate: number;
};

/** Anúncio rankeado por vendas (compras atribuídas pelo pixel) */
export type AdSales = {
  name: string;
  purchases: number;
  spend: number;
  costPerPurchase: number;
};

/** Vendas (compras) por faixa de idade */
export type AgeSales = { age: string; purchases: number };

/** Vendas (compras) por posicionamento (feed, reels, stories...) */
export type PlacementSales = { placement: string; purchases: number };

export type MetaData = {
  summary: MetaSummary;
  campaigns: CampaignRow[];
  /** Investimento por dia */
  timeline: { date: string; spend: number }[];
  /** Anúncios que mais trazem venda */
  topAds: AdSales[];
  /** Idade de quem compra */
  salesByAge: AgeSales[];
  /** Posicionamento que mais vende */
  salesByPlacement: PlacementSales[];
};

// --- Kiwify ---

export type KiwifySale = {
  id: string;
  productId: string;
  productName: string;
  /** Valor líquido reconhecido (R$) */
  amount: number;
  status: string;
  createdAt: string; // ISO
  isOrderBump: boolean;
  customerName?: string;
  paymentMethod?: string;
};

export type KiwifyData = {
  ingressos: number;
  faturamentoIngressos: number;
  orderbumps: number;
  faturamentoOrderbumps: number;
  faturamentoTotal: number;
  ticketMedio: number;
  /** Ingressos e faturamento por dia */
  timeline: { date: string; ingressos: number; faturamento: number }[];
  sales: KiwifySale[];
};

// --- Dashboard agregado ---

export type WorkshopDashboard = {
  period: { since: string; until: string };
  event: { start: string; end: string; label: string };
  goalTickets: number;
  meta: MetaData;
  kiwify: KiwifyData;
  /** Custo por ingresso = investimento Meta / ingressos */
  cpa: number;
  warnings: string[];
};
