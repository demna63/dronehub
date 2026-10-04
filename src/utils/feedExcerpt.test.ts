import { describe, expect, it } from 'vitest';
import { feedExcerpt } from './feedExcerpt';

describe('feedExcerpt', () => {
  it('collapses whitespace into a single line', () => {
    expect(feedExcerpt('პირველი ხაზი\n\nმეორე   ხაზი', 'სათაური')).toBe('პირველი ხაზი მეორე ხაზი');
  });

  it('returns nothing when the body is missing or only repeats the title', () => {
    expect(feedExcerpt('', 'სათაური')).toBe('');
    expect(feedExcerpt(null, 'სათაური')).toBe('');
    expect(feedExcerpt('  სათაური  ', 'სათაური')).toBe('');
  });
});
