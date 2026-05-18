import { Gauge, Layers, LineChart, Workflow, type LucideIcon } from 'lucide-react';

export type TabKey = 'principais' | 'funis' | 'secundarias' | 'campanhas';

export const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'principais', label: 'Métricas Principais', icon: Gauge },
  { key: 'funis', label: 'Funis', icon: Workflow },
  { key: 'secundarias', label: 'Métricas Secundárias', icon: LineChart },
  { key: 'campanhas', label: 'Campanhas', icon: Layers },
];
