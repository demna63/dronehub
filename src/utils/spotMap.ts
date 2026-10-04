import { SPOT_TYPES } from '../constants/spots';
import type { Spot, SpotStatus, SpotType } from '../types';

/** Known types on a pin. A spot saved before multi-type keeps its single `type`. */
export const spotTypeIds = (spot: { type: string; types?: readonly string[] | null }): string[] => {
  const listed = (spot.types ?? []).filter((id): id is string => typeof id === 'string' && SPOT_TYPES.some((type) => type.id === id));
  if (listed.length > 0) return listed;
  return spot.type ? [spot.type] : [];
};

/** Canonical order, so the pin colour does not depend on which chip was tapped first. */
export const orderedSpotTypes = (ids: readonly string[]): SpotType[] =>
  SPOT_TYPES.map((type) => type.id).filter((id) => ids.includes(id));

/** First known type, in catalogue order. */
export const primarySpotType = (ids: readonly string[]): SpotType => orderedSpotTypes(ids)[0] ?? 'bando';

export interface SpotFormInput {
  name: string;
  types: readonly string[];
  desc: string;
  warnings: string;
  status: SpotStatus;
  parking: boolean;
  power: boolean;
}

/** The document fields the create and update paths both send. */
export const spotFieldsFromForm = (
  form: SpotFormInput,
  coords: { lat: number; lng: number },
  image: string,
) => {
  const types = orderedSpotTypes(form.types);
  const safe = types.length > 0 ? types : (['bando'] as SpotType[]);
  return {
    name: form.name.trim(),
    type: safe[0],
    types: safe,
    description: form.desc.trim(),
    warnings: form.warnings.trim(),
    status: form.status,
    parking: form.parking,
    power: form.power,
    lat: coords.lat,
    lng: coords.lng,
    image,
  };
};

/** Name, description, author and warnings, so a pilot can search a hazard too. */
export const filterSpots = (spots: readonly Spot[], type: string, query: string): Spot[] => {
  const needle = query.trim().toLowerCase();
  return spots.filter((spot) => {
    if (type !== 'all' && !spotTypeIds(spot).includes(type)) return false;
    if (!needle) return true;
    const haystack = [spot.name, spot.description, spot.desc, spot.author, spot.warnings]
      .filter((part): part is string => Boolean(part))
      .join('\n')
      .toLowerCase();
    return haystack.includes(needle);
  });
};

/** Only an https URL is rendered. Anything else stays off the card. */
export const spotImageUrl = (value: unknown): string =>
  typeof value === 'string' && value.startsWith('https://') ? value : '';

/** The author, or an admin. A spot with no authorId can only be managed by an admin. */
export const canManageSpot = (
  spot: { authorId?: string },
  user: { id: string; isAdmin?: boolean } | null | undefined,
): boolean => Boolean(user && (user.isAdmin || (spot.authorId !== undefined && spot.authorId === user.id)));

/** Five decimals is about a metre, enough to meet someone at the pin. */
export const formatCoords = (lat: number, lng: number): string =>
  `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;

export const spotSharePath = (id: string): string => `/map?spot=${encodeURIComponent(id)}`;
