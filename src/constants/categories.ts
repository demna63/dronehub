import type { Category } from '../types';

/**
 * The feed's category taxonomy.
 *
 * Moved out of the old src/constants.ts, which was 80% mock fixtures
 * (MOCK_USERS, MOCK_NOTIFICATIONS, POPULAR_TAGS, an empty MOCK_POSTS) with no
 * consumers — this was the only live export in the file.
 */
export const CATEGORIES: Category[] = [
  { 
    id: 'general', 
    name: 'ზოგადი', 
    label: 'ზოგადი',
    icon: 'Hash', 
    description: 'ზოგადი საუბრები დრონებზე', 
    group: 'community',
    slug: 'r/general',
    subCategories: []
  },
  { 
    id: 'fpv', 
    name: 'FPV', 
    label: 'FPV',
    icon: 'Activity', 
    description: 'First Person View დრონები, აწყობა, ფრენა', 
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
    label: 'Racing League',
    icon: 'Flag', 
    description: 'რბოლები, ტურნირები, შედეგები და ტრასები.',
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
    label: 'Cine Drone',
    icon: 'Camera', 
    description: 'სინემატიკური გადაღებები (DJI, Autel, etc.)', 
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
    name: 'მარკეტი', 
    label: 'მარკეტი',
    icon: 'ShoppingBag', 
    description: 'ყიდვა-გაყიდვა', 
    group: 'marketplace',
    slug: 'r/market',
    subCategories: [
      { id: 'drones', label: 'დრონები' },
      { id: 'parts', label: 'ნაწილები' },
      { id: 'goggles', label: 'სათვალეები' }
    ]
  },
  { 
    id: 'help', 
    name: 'დახმარება', 
    label: 'დახმარება',
    icon: 'HelpCircle', 
    description: 'კითხვა-პასუხი და დახმარება', 
    group: 'resources',
    slug: 'r/help',
    subCategories: []
  },
  { 
    id: 'events', 
    name: 'Events', 
    label: 'Events',
    icon: 'Calendar', 
    description: 'შეკრებები, ღონისძიებები და ფრენის დღეები.',
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
    label: 'Local Stores',
    icon: 'ShoppingCart', 
    description: 'პარტნიორი მაღაზიები და ოფიციალური დილერები.',
    group: 'resources',
    slug: 'r/stores',
    subCategories: [
      { id: 'dronehub', label: 'DroneHub Store' },
      { id: 'partners', label: 'Partner Deals' }
    ]
  }
];
