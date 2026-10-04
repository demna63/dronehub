import type { SpotType } from '../types';

/**
 * Pin colours are data colours. The rest of the map stays on the one accent.
 * `freestyle` is what the form already saved; `racing` and `open` were on the
 * type and missing from the filter, so those pins had no chip and no colour.
 */
export const SPOT_TYPES: readonly {
  id: SpotType;
  labelKey: string;
  shortKey: string;
  color: string;
}[] = [
  { id: 'bando', labelKey: 'spot_type_bando', shortKey: 'spot_type_bando_short', color: '#fb7185' },
  { id: 'cinematic', labelKey: 'spot_type_cinematic', shortKey: 'spot_type_cinematic_short', color: '#34d399' },
  { id: 'freestyle', labelKey: 'spot_type_freestyle', shortKey: 'spot_type_freestyle_short', color: '#fbbf24' },
  { id: 'racing', labelKey: 'spot_type_racing', shortKey: 'spot_type_racing_short', color: '#60a5fa' },
  { id: 'open', labelKey: 'spot_type_open', shortKey: 'spot_type_open_short', color: '#c4b5fd' },
];

export const spotTypeOf = (id: string) => SPOT_TYPES.find((type) => type.id === id);

export const isSpotType = (id: string): id is SpotType => SPOT_TYPES.some((type) => type.id === id);
