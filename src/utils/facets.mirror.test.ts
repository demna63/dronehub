import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildFacets } from './facets';

/**
 * Drift guard for the hand-mirrored copy of `buildFacets` in
 * functions/index.js. The backfill writes `facets` with its copy and the client
 * writes them with this one; if the two normalise differently, a post's facets
 * depend on which code path last touched it and the category filter starts
 * missing posts at random.
 *
 * The mirror is evaluated rather than pattern-matched, so this compares actual
 * behaviour on the cases that matter, not the presence of a string.
 */
const source = readFileSync(resolve(__dirname, '../../functions/index.js'), 'utf8');

const extractMirror = (): ((input: unknown) => string[]) => {
  const match = source.match(/const buildFacets = \(\{[\s\S]*?\n\};/);
  expect(match, 'buildFacets is no longer defined in functions/index.js').not.toBeNull();
  return new Function(`${match![0]}\nreturn buildFacets;`)() as (input: unknown) => string[];
};

describe('buildFacets mirrors functions/index.js', () => {
  const mirror = extractMirror();

  it('fails when the mirror drifts', () => {
    // Confidence check on the guard itself: a mirror that skipped the
    // lowercasing must not still compare equal.
    const drifted = new Function(
      'return ({ category, subCategory, tags }) => [category, subCategory, ...(tags ?? [])].filter(Boolean);',
    )() as (input: unknown) => string[];
    expect(drifted({ category: 'FPV', tags: [] })).not.toEqual(buildFacets({ category: 'FPV', tags: [] }));
  });

  const cases = [
    { category: 'FPV', subCategory: 'fpv', tags: ['FPV', 'Build'] },
    { category: '  ', subCategory: null, tags: ['  Build  ', '', undefined] },
    { category: 'Cinematic', subCategory: undefined, tags: [] },
    { category: 'market', subCategory: 'drones', tags: ['market', 'drones', 'DJI'] },
    {},
  ];

  for (const [index, input] of cases.entries()) {
    it(`agrees on case ${index}`, () => {
      expect(mirror(input)).toEqual(buildFacets(input));
    });
  }
});
