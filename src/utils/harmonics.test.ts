import { describe, expect, it } from 'vitest';
import { VTX_ALL_BANDS } from '../constants/toolsData';
import { analyzeHarmonics, computeHarmonics, isValidInput } from './harmonics';

const names = (r: ReturnType<typeof analyzeHarmonics>, order: number) =>
  (r.affected.get(order) ?? []).map((c) => c.name);

describe('computeHarmonics', () => {
  it('scales both edges by the order', () => {
    const h = computeHarmonics(915, 30).find((x) => x.order === 6)!;
    expect(h.min).toBe(5400);
    expect(h.max).toBe(5580);
  });

  it('stops at the spectrum limit and the order cap', () => {
    expect(computeHarmonics(915, 30).at(-1)!.order).toBe(9);
    expect(computeHarmonics(100, 2).at(-1)!.order).toBe(15);
  });

  it('returns nothing for unusable input', () => {
    for (const [c, w] of [[0, 30], [915, 0], [915, -30], [NaN, 30], [915, 2000]]) {
      expect(computeHarmonics(c, w)).toEqual([]);
      expect(isValidInput(c, w)).toBe(false);
    }
  });
});

describe('analyzeHarmonics', () => {
  it('counts a channel whose occupied band overlaps, not just its centre', () => {
    // 6th harmonic of 915/30 ends at 5580; L7 sits at 5584, so its 20 MHz-wide
    // band overlaps even though the centre does not.
    const r = analyzeHarmonics(915, 30, VTX_ALL_BANDS);
    expect(names(r, 6)).toContain('L7');
  });

  it('flags the fundamental when the control link sits inside a VTX band', () => {
    const r = analyzeHarmonics(1280, 10, VTX_ALL_BANDS);
    expect(names(r, 1)).toContain('1.3G-6');
  });

  it('puts every channel in exactly one bucket', () => {
    const total = VTX_ALL_BANDS.reduce((n, b) => n + b.channels.length, 0);
    const r = analyzeHarmonics(868, 2, VTX_ALL_BANDS);
    const count = [...r.affected.values(), ...r.unaffected.values()].reduce((n, l) => n + l.length, 0);
    expect(count).toBe(total);
  });

  it('reports no hits on invalid input rather than a false all-clear', () => {
    expect(analyzeHarmonics(0, 30, VTX_ALL_BANDS).harmonics).toEqual([]);
  });
});

describe('VTX_ALL_BANDS data', () => {
  it('has unique channel names across bands', () => {
    const all = VTX_ALL_BANDS.flatMap((b) => b.channels.map((c) => c.name));
    expect(new Set(all).size).toBe(all.length);
  });

  it('has the eight distinct 3.3G bands', () => {
    const g33 = VTX_ALL_BANDS.filter((b) => b.name.startsWith('Band 3.3G'));
    expect(g33.map((b) => b.name)).toEqual(['A', 'B', 'E', 'F', 'R', 'L', 'X', 'Y'].map((x) => `Band 3.3G-${x}`));
    expect(new Set(g33.map((b) => b.channels.map((c) => c.freq).join())).size).toBe(8);
  });
});
