import { describe, expect, it } from 'vitest';
import { coverCropRect } from './coverCrop';

describe('coverCropRect', () => {
  it('trims the sides of a wide image', () => {
    const crop = coverCropRect(3000, 500, 3);
    expect(crop.sh).toBe(500);
    expect(crop.sw).toBe(1500);
    expect(crop.sx).toBe(750);
    expect(crop.sy).toBe(0);
  });

  it('trims the top and bottom of a tall image', () => {
    const crop = coverCropRect(900, 900, 3);
    expect(crop.sw).toBe(900);
    expect(crop.sh).toBe(300);
    expect(crop.sy).toBe(300);
  });
});
