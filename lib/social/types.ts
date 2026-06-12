// Tipos do dashboard de Social Selling (Instagram).

export type SocialProfile = {
  username: string;
  name: string;
  followerCount: number;
  mediaCount: number;
  biography: string;
  profilePictureUrl: string;
  website: string;
};

export type SocialInsightPoint = {
  date: string; // yyyy-mm-dd
  reach: number;
};

export type SocialSummary = {
  profile: SocialProfile;
  /** Métricas de insights (podem vir vazias se o app não tiver instagram_manage_insights). */
  reach: number | null;
  profileViews: number | null;
  accountsEngaged: number | null;
  totalInteractions: number | null;
  linkClicks: number | null;
  /** Série diária de alcance (vazia se insights indisponíveis). */
  timeline: SocialInsightPoint[];
  /** Avisos (ex.: permissões faltando). */
  warnings: string[];
  /** True quando ao menos uma métrica de insights veio. */
  insightsAvailable: boolean;
};

export function emptySocialSummary(): SocialSummary {
  return {
    profile: {
      username: '',
      name: '',
      followerCount: 0,
      mediaCount: 0,
      biography: '',
      profilePictureUrl: '',
      website: '',
    },
    reach: null,
    profileViews: null,
    accountsEngaged: null,
    totalInteractions: null,
    linkClicks: null,
    timeline: [],
    warnings: [],
    insightsAvailable: false,
  };
}
