import type { LucideIcon } from 'lucide-react';
import { Activity, Home, Radio } from 'lucide-react';

export type EcosystemSiteId = 'main' | 'pid' | 'vtx';

export interface EcosystemLink {
  id: EcosystemSiteId;
  labelKey: string;
  url: string;
  icon: LucideIcon;
}

export const ECOSYSTEM_LINKS: EcosystemLink[] = [
  {
    id: 'main',
    labelKey: 'eco_main',
    url: 'https://dronehub.ge',
    icon: Home,
  },
  {
    id: 'pid',
    labelKey: 'eco_pid',
    url: 'https://pid-dronehub.ge',
    icon: Activity,
  },
  {
    id: 'vtx',
    labelKey: 'eco_vtx',
    url: 'https://vtx-dronehub.web.app',
    icon: Radio,
  },
];

export function isExternalEcosystemUrl(url: string): boolean {
  return url.startsWith('http');
}
