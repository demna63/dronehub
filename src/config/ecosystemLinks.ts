import type { LucideIcon } from 'lucide-react';
import { Activity, Home, Radio } from 'lucide-react';

export type EcosystemSiteId = 'main' | 'pid' | 'vtx';

export interface EcosystemLink {
  id: EcosystemSiteId;
  labelKey: string;
  labelFallback: string;
  url: string;
  icon: LucideIcon;
}

export const ECOSYSTEM_LINKS: EcosystemLink[] = [
  {
    id: 'main',
    labelKey: 'eco_main',
    labelFallback: 'DroneHub.ge',
    url: 'https://dronehub.ge',
    icon: Home,
  },
  {
    id: 'pid',
    labelKey: 'eco_pid',
    labelFallback: 'PID კალკულატორი',
    url: 'https://pid-dronehub.ge',
    icon: Activity,
  },
  {
    id: 'vtx',
    labelKey: 'eco_vtx',
    labelFallback: 'VTX გენერატორი',
    url: 'https://vtx-dronehub.web.app',
    icon: Radio,
  },
];

export function isExternalEcosystemUrl(url: string): boolean {
  return url.startsWith('http');
}
