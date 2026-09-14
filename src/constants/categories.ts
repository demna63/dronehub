import type { Category } from '../types';

/**
 * The feed's category taxonomy.
 *
 * `name`, `label` and `description` hold English text and exist only as a
 * fallback; what renders is `nameKey` / `descriptionKey` through `t`. Keeping
 * the Georgian here as well would mean two copies of every category name, one
 * of which nobody updates.
 *
 * Moved out of the old src/constants.ts, which was 80% mock fixtures
 * (MOCK_USERS, MOCK_NOTIFICATIONS, POPULAR_TAGS, an empty MOCK_POSTS) with no
 * consumers — this was the only live export in the file.
 */
export const CATEGORIES: Category[] = [
  { 
    id: 'general', 
    name: 'General',
    nameKey: 'cat_general', 
    label: 'General',
    icon: 'Hash', 
    description: 'General drone talk',
    descriptionKey: 'cat_general_desc', 
    group: 'community',
    slug: 'r/general',
    subCategories: []
  },
  { 
    id: 'fpv', 
    name: 'FPV',
    nameKey: 'cat_fpv', 
    label: 'FPV',
    icon: 'Activity', 
    description: 'First-person-view drones: builds and flying',
    descriptionKey: 'cat_fpv_desc', 
    group: 'community',
    slug: 'r/fpv',
    subCategories: [
      { id: 'freestyle', label: 'Freestyle' },
      { id: 'racing', label: 'Racing' },
      { id: 'long-range', label: 'Long Range' },
      { id: 'builds', label: 'Builds & Setup' }
    ]
  },
  { 
    id: 'racing', 
    name: 'Racing League',
    nameKey: 'cat_racing', 
    label: 'Racing League',
    icon: 'Flag', 
    description: 'Races, tournaments, results and tracks.',
    descriptionKey: 'cat_racing_desc',
    group: 'community',
    slug: 'r/racing',
    subCategories: [
      { id: 'events', label: 'Events' },
      { id: 'tracks', label: 'Track Design' },
      { id: 'laps', label: 'Lap Times' }
    ]
  },
  { 
    id: 'cinematic', 
    name: 'Cine Drone',
    nameKey: 'cat_cinematic', 
    label: 'Cine Drone',
    icon: 'Camera', 
    description: 'Cinematic filming (DJI, Autel, etc.)',
    descriptionKey: 'cat_cinematic_desc', 
    group: 'community',
    slug: 'r/cine',
    subCategories: [
      { id: 'mavic', label: 'Mavic Series' },
      { id: 'mini', label: 'Mini Series' },
      { id: 'avata', label: 'Avata / FPV' },
      { id: 'photography', label: 'Photography Tips' }
    ]
  },
  { 
    id: 'marketplace', 
    name: 'Market',
    nameKey: 'cat_marketplace', 
    label: 'Market',
    icon: 'ShoppingBag', 
    description: 'Buying and selling',
    descriptionKey: 'cat_marketplace_desc', 
    group: 'marketplace',
    slug: 'r/market',
    subCategories: [
      { id: 'drones', label: 'Drones' },
      { id: 'parts', label: 'Parts' },
      { id: 'goggles', label: 'Goggles' }
    ]
  },
  { 
    id: 'help', 
    name: 'Help',
    nameKey: 'cat_help', 
    label: 'Help',
    icon: 'HelpCircle', 
    description: 'Questions, answers and help',
    descriptionKey: 'cat_help_desc', 
    group: 'resources',
    slug: 'r/help',
    subCategories: []
  },
  { 
    id: 'events', 
    name: 'Events',
    nameKey: 'cat_events', 
    label: 'Events',
    icon: 'Calendar', 
    description: 'Meet-ups, events and fly days.',
    descriptionKey: 'cat_events_desc',
    group: 'resources',
    slug: 'r/events',
    subCategories: [
      { id: 'local', label: 'Local' },
      { id: 'inter', label: 'International' }
    ]
  },
  { 
    id: 'stores', 
    name: 'Local Stores',
    nameKey: 'cat_stores', 
    label: 'Local Stores',
    icon: 'ShoppingCart', 
    description: 'Partner shops and official dealers.',
    descriptionKey: 'cat_stores_desc',
    group: 'resources',
    slug: 'r/stores',
    subCategories: [
      { id: 'dronehub', label: 'DroneHub Store' },
      { id: 'partners', label: 'Partner Deals' }
    ]
  }
];
