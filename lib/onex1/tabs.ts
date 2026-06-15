import { Gauge, LineChart, Target, type LucideIcon } from 'lucide-react';

export type TabKey = 'principais' | 'secundarias' | 'leadscore';

export const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'principais', label: 'Métricas Principais', icon: Gauge },
  { key: 'secundarias', label: 'Métricas Secundárias', icon: LineChart },
  { key: 'leadscore', label: 'Lead Score', icon: Target },
];
