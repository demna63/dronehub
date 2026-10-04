import { describe, expect, it } from 'vitest';
import { profileAverageStars } from './profileRating';

describe('profileAverageStars', () => {
  it('ignores posts nobody has rated', () => {
    expect(profileAverageStars([
      { telemetry: { utility: 0, skill: 0, vision: 0, count: 0 } },
      {},
    ])).toBeNull();
  });

  it('averages the star values of rated posts', () => {
    expect(profileAverageStars([
      { telemetry: { utility: 100, skill: 100, vision: 100, count: 1 } },
      { telemetry: { utility: 60, skill: 60, vision: 60, count: 1 } },
      { telemetry: { utility: 0, skill: 0, vision: 0, count: 0 } },
    ])).toBe(4);
  });
});
