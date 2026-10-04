import type { VTXBandGroup } from '../constants/toolsData';

/** Harmonics above this order are too weak to matter and are not computed. */
export const MAX_HARMONIC_ORDER = 15;
/** Upper edge of the VTX spectrum we cover (MHz). Harmonics beyond it cannot hit a channel. */
export const MAX_FREQ_MHZ = 8000;
/** Occupied bandwidth (MHz) assumed for a VTX channel when the band is not listed below. */
export const DEFAULT_VIDEO_BANDWIDTH = 25;

const VIDEO_BANDWIDTH: Record<string, number> = {
  'Band 1.3G': 20,
};

export const videoBandwidthOf = (bandName: string): number =>
  bandName.startsWith('Band 3.3G') ? 20 : (VIDEO_BANDWIDTH[bandName] ?? DEFAULT_VIDEO_BANDWIDTH);

export interface Harmonic {
  order: number;
  min: number;
  max: number;
  center: number;
}

export interface ChannelHit {
  band: string;
  name: string;
  freq: number;
}

export interface HarmonicsResult {
  harmonics: Harmonic[];
  /** Affected channels keyed by the harmonic order that lands on them (lowest order wins per channel). */
  affected: Map<number, ChannelHit[]>;
  /** Clear channels keyed by band name. */
  unaffected: Map<string, ChannelHit[]>;
}

/** A usable input is a finite, positive centre and a finite, positive width narrower than twice the centre. */
export const isValidInput = (centerFreq: number, width: number): boolean =>
  Number.isFinite(centerFreq) && Number.isFinite(width) && centerFreq > 0 && width > 0 && width < centerFreq * 2;

export const computeHarmonics = (centerFreq: number, width: number): Harmonic[] => {
  if (!isValidInput(centerFreq, width)) return [];
  const half = width / 2;
  const last = Math.min(Math.ceil(MAX_FREQ_MHZ / centerFreq), MAX_HARMONIC_ORDER);
  const out: Harmonic[] = [];
  for (let order = 1; order <= last; order++) {
    out.push({ order, min: order * (centerFreq - half), max: order * (centerFreq + half), center: order * centerFreq });
  }
  return out;
};

/**
 * A channel is hit when its occupied band `freq ± bandwidth/2` overlaps the
 * harmonic's `[min, max]`. The fundamental (order 1) is included so a control
 * link sitting inside a VTX band is reported too.
 */
export const analyzeHarmonics = (
  centerFreq: number,
  width: number,
  bands: VTXBandGroup[],
): HarmonicsResult => {
  const harmonics = computeHarmonics(centerFreq, width);
  const affected = new Map<number, ChannelHit[]>();
  const unaffected = new Map<string, ChannelHit[]>();
  const push = <K,>(map: Map<K, ChannelHit[]>, key: K, hit: ChannelHit) => {
    const list = map.get(key);
    if (list) list.push(hit);
    else map.set(key, [hit]);
  };

  for (const band of bands) {
    const halfVideo = videoBandwidthOf(band.name) / 2;
    for (const ch of band.channels) {
      const hit: ChannelHit = { band: band.name, name: ch.name, freq: ch.freq };
      const h = harmonics.find((x) => x.max <= MAX_FREQ_MHZ && ch.freq - halfVideo <= x.max && x.min <= ch.freq + halfVideo);
      if (h) push(affected, h.order, hit);
      else push(unaffected, band.name, hit);
    }
  }
  return { harmonics, affected, unaffected };
};
