/**
 * Link-level interference model for the harmonics tool.
 *
 * Two emitters (control TX, video VTX) and two victims (drone RX, goggle VRX).
 * A product lands on a victim when its occupied band overlaps the victim's
 * channel; whether it matters depends on its level against the victim's noise
 * floor. Two mechanisms are modelled:
 *
 *  - harmonics: the emitter's own n·f, reduced by a harmonic suppression figure
 *    and by free-space path loss to the victim;
 *  - intermodulation: products Σ m_i·f_i generated in the *victim's* front end
 *    (power-series model). An order-K product from tones P_i has the input-
 *    referred level  Σ|m_i|·P_i − (K−1)·IIP_K  (dBm); for K=3, 2f1−f2 this is
 *    2·P1 + P2 − 2·IIP3.
 *
 * Everything is an estimate: 0 dBi antennas, free-space propagation, and the
 * IIP2/IIP4/IIP5 figures derived from IIP3 below.
 */

export const MAX_HARMONIC_ORDER = 15;
export const MAX_FREQ_MHZ = 8000;
export const MIN_DISTANCE_M = 0.05;
/** Findings weaker than this margin (dB over the noise floor) are dropped as noise. */
export const REPORT_FLOOR_DB = -10;

export const IIP2_OFFSET_DB = 20;
export const IIP_HIGH_ORDER_OFFSET_DB = 10;
/** Harmonic suppression grows by this much per order above the second. */
export const SUPPRESSION_SLOPE_DB = 3;

export const mwToDbm = (mw: number): number => 10 * Math.log10(mw);

/** The emitter each receiver is meant to hear; its fundamental is the wanted signal, not interference. */
const OWN_SOURCE: Record<VictimId, EmitterId> = { rx: 'tx', vrx: 'vtx' };

/** Free-space path loss in dB for a distance in metres and a frequency in MHz. */
export const fsplDb = (distanceM: number, freqMHz: number): number =>
  20 * Math.log10(Math.max(distanceM, MIN_DISTANCE_M) / 1000) + 20 * Math.log10(freqMHz) + 32.44;

/** Thermal noise floor of a receiver: -174 dBm/Hz + 10·log10(B) + NF. */
export const noiseFloorDbm = (bwMHz: number, nfDb: number): number =>
  -174 + 10 * Math.log10(bwMHz * 1e6) + nfDb;

export type EmitterId = 'tx' | 'vtx' | 'vtx2';
export type VictimId = 'rx' | 'vrx';
export type Severity = 'critical' | 'warning' | 'marginal' | 'ok';

export interface Emitter {
  id: EmitterId;
  freq: number;
  bw: number;
  powerDbm: number;
}

export interface Victim {
  id: VictimId;
  freq: number;
  bw: number;
  iip3Dbm: number;
  nfDb: number;
  /** Detection bandwidth for the noise floor (MHz); defaults to `bw`. */
  noiseBw?: number;
  /** Pre-selector attenuation applied to tones outside the victim's own band. */
  rejectionDb: number;
}

export interface Geometry {
  /** Control TX ↔ goggles (both on the pilot). */
  pilotM: number;
  /** Pilot ↔ drone. */
  droneM: number;
  /** VTX ↔ control RX on the same airframe. */
  onboardM: number;
  /** A second pilot's drone ↔ our goggles and our drone's RX (group flight). */
  otherDroneM: number;
}

export interface Options {
  /** Suppression of the 2nd harmonic in dBc. */
  harmonicSuppressionDb: number;
  /** Highest intermodulation order considered (2–5). */
  maxIntermodOrder: number;
}

export interface Term {
  emitter: EmitterId;
  m: number;
}

export interface Finding {
  mechanism: 'fundamental' | 'harmonic' | 'intermod';
  victim: VictimId;
  /** Harmonic number n, or the product order K. */
  order: number;
  terms: Term[];
  freq: number;
  bw: number;
  levelDbm: number;
  noiseDbm: number;
  marginDb: number;
  severity: Severity;
}

export const severityOf = (marginDb: number): Severity =>
  marginDb > 10 ? 'critical' : marginDb > 0 ? 'warning' : marginDb > REPORT_FLOOR_DB ? 'marginal' : 'ok';

const DISTANCE_KEY: Record<`${EmitterId}-${VictimId}`, keyof Geometry> = {
  'tx-vrx': 'pilotM',
  'tx-rx': 'droneM',
  'vtx-vrx': 'droneM',
  'vtx-rx': 'onboardM',
  'vtx2-vrx': 'otherDroneM',
  'vtx2-rx': 'otherDroneM',
};

export const pathLossDb = (emitter: EmitterId, victim: VictimId, freqMHz: number, geo: Geometry): number =>
  fsplDb(geo[DISTANCE_KEY[`${emitter}-${victim}`]], freqMHz);

const overlaps = (centerA: number, bwA: number, centerB: number, bwB: number): boolean =>
  Math.abs(centerA - centerB) <= (bwA + bwB) / 2;

export const iipFor = (iip3Dbm: number, order: number): number =>
  order <= 2 ? iip3Dbm + IIP2_OFFSET_DB : order === 3 ? iip3Dbm : iip3Dbm + IIP_HIGH_ORDER_OFFSET_DB;

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));

/** K! / Π|m_i|! — how many ways the a_K·v^K term produces this product. */
const multinomial = (ms: number[]): number =>
  factorial(ms.reduce((n, m) => n + Math.abs(m), 0)) / ms.reduce((p, m) => p * factorial(Math.abs(m)), 1);

/**
 * Gain of a product over the two-tone reference that IIP_K is specified with
 * (2f1−f2 for K=3). Expanding (A1cos ω1t + A2cos ω2t + A3cos ω3t)³ gives 3/4 for
 * 2f1−f2 but 3/2 for f1+f2−f3, so the three-tone product is +6.02 dB.
 */
export const productGainDb = (ms: number[]): number => {
  const order = ms.reduce((n, m) => n + Math.abs(m), 0);
  const ref = multinomial([Math.ceil(order / 2), Math.floor(order / 2)]);
  return 20 * Math.log10(multinomial(ms) / ref);
};

/** Input-referred level of an order-K product given the tone powers at the nonlinear stage. */
export const intermodLevelDbm = (
  tones: { powerDbm: number; m: number }[],
  iip3Dbm: number,
): number => {
  const order = tones.reduce((n, t) => n + Math.abs(t.m), 0);
  const sum = tones.reduce((s, t) => s + Math.abs(t.m) * t.powerDbm, 0);
  return sum - (order - 1) * iipFor(iip3Dbm, order) + productGainDb(tones.map((t) => t.m));
};

/** Every integer vector with Σ|m| ≤ maxOrder and at least two non-zero entries. */
export const coefficientVectors = (n: number, maxOrder: number): number[][] => {
  const out: number[][] = [];
  const walk = (i: number, vec: number[], used: number) => {
    if (i === n) {
      if (vec.filter(Boolean).length >= 2) out.push(vec.slice());
      return;
    }
    for (let m = -(maxOrder - used); m <= maxOrder - used; m++) {
      vec.push(m);
      walk(i + 1, vec, used + Math.abs(m));
      vec.pop();
    }
  };
  walk(0, [], 0);
  return out;
};

const finish = (f: Omit<Finding, 'marginDb' | 'severity'>): Finding => {
  const marginDb = f.levelDbm - f.noiseDbm;
  return { ...f, marginDb, severity: severityOf(marginDb) };
};

export const analyzeLinks = (
  emitters: Emitter[],
  victims: Victim[],
  geo: Geometry,
  opts: Options,
): Finding[] => {
  const findings: Finding[] = [];

  for (const victim of victims) {
    const noiseDbm = noiseFloorDbm(victim.noiseBw ?? victim.bw, victim.nfDb);

    // Another emitter's own signal sitting in the victim's channel (co- or adjacent channel).
    for (const e of emitters) {
      if (e.id === OWN_SOURCE[victim.id] || !overlaps(e.freq, e.bw, victim.freq, victim.bw)) continue;
      findings.push(finish({
        mechanism: 'fundamental', victim: victim.id, order: 1,
        terms: [{ emitter: e.id, m: 1 }], freq: e.freq, bw: e.bw,
        levelDbm: e.powerDbm - pathLossDb(e.id, victim.id, e.freq, geo), noiseDbm,
      }));
    }

    // Harmonics of each emitter radiated straight into the victim's band.
    for (const e of emitters) {
      const last = Math.min(Math.ceil(MAX_FREQ_MHZ / e.freq), MAX_HARMONIC_ORDER);
      for (let n = 2; n <= last; n++) {
        const freq = n * e.freq;
        const bw = n * e.bw;
        if (freq > MAX_FREQ_MHZ || !overlaps(freq, bw, victim.freq, victim.bw)) continue;
        const suppression = opts.harmonicSuppressionDb + SUPPRESSION_SLOPE_DB * (n - 2);
        const levelDbm = e.powerDbm - suppression - pathLossDb(e.id, victim.id, freq, geo);
        findings.push(finish({
          mechanism: 'harmonic', victim: victim.id, order: n,
          terms: [{ emitter: e.id, m: n }], freq, bw, levelDbm, noiseDbm,
        }));
      }
    }

    // Intermodulation generated in the victim's front end by the incident tones.
    const tonePower = emitters.map((e) => {
      const outOfBand = !overlaps(e.freq, e.bw, victim.freq, victim.bw);
      return e.powerDbm - pathLossDb(e.id, victim.id, e.freq, geo) - (outOfBand ? victim.rejectionDb : 0);
    });
    for (const vec of coefficientVectors(emitters.length, opts.maxIntermodOrder)) {
      const freq = vec.reduce((s, m, i) => s + m * emitters[i].freq, 0);
      if (freq <= 0) continue;
      const bw = vec.reduce((s, m, i) => s + Math.abs(m) * emitters[i].bw, 0);
      if (!overlaps(freq, bw, victim.freq, victim.bw)) continue;
      const tones = vec.map((m, i) => ({ m, powerDbm: tonePower[i] })).filter((t) => t.m !== 0);
      const order = tones.reduce((n, t) => n + Math.abs(t.m), 0);
      findings.push(finish({
        mechanism: 'intermod', victim: victim.id, order,
        terms: vec.flatMap((m, i) => (m ? [{ emitter: emitters[i].id, m }] : [])),
        freq, bw, levelDbm: intermodLevelDbm(tones, victim.iip3Dbm), noiseDbm,
      }));
    }
  }

  return findings.sort((a, b) => b.marginDb - a.marginDb);
};

/** "2·VTX − TX" style label for a product. */
export const formatTerms = (terms: Term[], names: Record<EmitterId, string>): string =>
  terms
    .map((t, i) => {
      const mag = Math.abs(t.m);
      const body = `${mag === 1 ? '' : `${mag}·`}${names[t.emitter]}`;
      if (i === 0) return t.m < 0 ? `−${body}` : body;
      return `${t.m < 0 ? '−' : '+'} ${body}`;
    })
    .join(' ');
