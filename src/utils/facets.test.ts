import { describe, expect, it } from 'vitest';
import { buildFacets, toFacet } from './facets';

describe('buildFacets', () => {
  it('lowercases and de-duplicates across all three sources', () => {
    expect(buildFacets({ category: 'FPV', subCategory: 'fpv', tags: ['FPV', 'Build'] }))
      .toEqual(['fpv', 'build']);
  });

  it('drops empty, whitespace and non-string entries', () => {
    expect(buildFacets({ category: '  ', subCategory: null, tags: ['  Build  ', '', undefined] }))
      .toEqual(['build']);
  });

  it('returns an empty array when there is nothing to index', () => {
    expect(buildFacets({})).toEqual([]);
  });

  it('normalises a lookup value the same way it normalises stored ones', () => {
    const facets = buildFacets({ category: 'Cinematic', tags: [] });
    expect(facets).toContain(toFacet('  CINEMATIC '));
  });

  it('keeps order stable so a rewrite does not churn the document', () => {
    const input = { category: 'fpv', subCategory: 'racing', tags: ['5inch'] };
    expect(buildFacets(input)).toEqual(buildFacets(input));
    expect(buildFacets(input)).toEqual(['fpv', 'racing', '5inch']);
  });
});
