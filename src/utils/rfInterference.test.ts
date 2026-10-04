import { describe, expect, it } from 'vitest';
import {
  analyzeLinks, coefficientVectors, formatTerms, fsplDb, intermodLevelDbm, mwToDbm, noiseFloorDbm, severityOf,
  type Emitter, type Geometry, type Options, type Victim,
} from './rfInterference';

const geo: Geometry = { pilotM: 1, droneM: 100, onboardM: 0.1 };
const opts: Options = { harmonicSuppressionDb: 45, maxIntermodOrder: 5 };
const rx = (freq: number): Victim => ({ id: 'rx', freq, bw: 5, iip3Dbm: -10, nfDb: 6, rejectionDb: 25 });
const vrx = (freq: number): Victim => ({ id: 'vrx', freq, bw: 20, iip3Dbm: -20, nfDb: 6, rejectionDb: 15 });
const tx = (freq: number, mw = 250): Emitter => ({ id: 'tx', freq, bw: 30, powerDbm: mwToDbm(mw) });
const vtx = (freq: number, mw = 200): Emitter => ({ id: 'vtx', freq, bw: 20, powerDbm: mwToDbm(mw) });

describe('basic RF maths', () => {
  it('computes free-space path loss', () => {
    expect(fsplDb(1, 5800)).toBeCloseTo(47.71, 1);
  });

  it('computes the noise floor', () => {
    expect(noiseFloorDbm(20, 6)).toBeCloseTo(-94.99, 1);
  });

  it('converts mW to dBm', () => {
    expect(mwToDbm(1000)).toBeCloseTo(30, 5);
  });

  it('grades severity by margin over the noise floor', () => {
    expect(severityOf(15)).toBe('critical');
    expect(severityOf(5)).toBe('warning');
    expect(severityOf(-5)).toBe('marginal');
    expect(severityOf(-20)).toBe('ok');
  });
});

describe('intermodLevelDbm', () => {
  it('matches P_IM3 = 3·Pin − 2·IIP3 for equal tones', () => {
    const tones = [{ powerDbm: -30, m: 2 }, { powerDbm: -30, m: -1 }];
    expect(intermodLevelDbm(tones, -10)).toBeCloseTo(-70, 5);
  });

  it('rises 3 dB per dB of input for third order', () => {
    const at = (p: number) => intermodLevelDbm([{ powerDbm: p, m: 2 }, { powerDbm: p, m: -1 }], -10);
    expect(at(-20) - at(-30)).toBeCloseTo(30, 5);
  });

  it('weights each tone by its multiplier', () => {
    // 2f1 − f2 with P1 = -20, P2 = -40: 2·(-20) + (-40) − 2·(-10) = -60
    expect(intermodLevelDbm([{ powerDbm: -20, m: 2 }, { powerDbm: -40, m: -1 }], -10)).toBeCloseTo(-60, 5);
  });
});

describe('coefficientVectors', () => {
  it('lists the mixed products of two tones up to order 3', () => {
    expect(coefficientVectors(2, 3)).toHaveLength(12);
  });

  it('never returns a pure harmonic', () => {
    expect(coefficientVectors(2, 5).every((v) => v.filter(Boolean).length >= 2)).toBe(true);
  });

  it('includes the three-tone f1 + f2 − f3 product', () => {
    expect(coefficientVectors(3, 3).some((v) => v.join() === '1,1,-1')).toBe(true);
  });
});

describe('analyzeLinks', () => {
  it('flags a control-link harmonic landing on the goggles', () => {
    // 6 × 915 = 5490 ± 90 covers L7 at 5584 ± 10.
    const f = analyzeLinks([tx(915), vtx(5584)], [vrx(5584)], geo, opts)
      .find((x) => x.mechanism === 'harmonic' && x.order === 6)!;
    expect(f.victim).toBe('vrx');
    expect(f.severity).toBe('critical');
  });

  it('flags a 1.2G VTX second harmonic on a 2.4G control receiver', () => {
    const f = analyzeLinks([tx(2400), vtx(1200)], [rx(2400)], geo, opts)
      .find((x) => x.mechanism === 'harmonic' && x.order === 2);
    expect(f).toBeDefined();
  });

  it('reports nothing when no product lands on the victim', () => {
    expect(analyzeLinks([tx(868), vtx(5800)], [vrx(5800)], geo, { ...opts, maxIntermodOrder: 3 })).toEqual([]);
  });

  it('finds an IM3 product 2·f2 − f1 on the victim', () => {
    // 2·1010 − 1000 = 1020; victim tuned there.
    const e1: Emitter = { id: 'tx', freq: 1000, bw: 2, powerDbm: 20 };
    const e2: Emitter = { id: 'vtx', freq: 1010, bw: 2, powerDbm: 20 };
    const f = analyzeLinks([e1, e2], [{ ...vrx(1020), bw: 2 }], geo, opts)
      .find((x) => x.mechanism === 'intermod' && x.order === 3);
    expect(f).toBeDefined();
    expect(formatTerms(f!.terms, { tx: 'TX', vtx: 'VTX' })).toBe('−TX + 2·VTX');
  });

  it('sorts the worst margin first', () => {
    const out = analyzeLinks([tx(915), vtx(5584)], [rx(915), vrx(5584)], geo, opts);
    for (let i = 1; i < out.length; i++) expect(out[i - 1].marginDb).toBeGreaterThanOrEqual(out[i].marginDb);
  });
});
