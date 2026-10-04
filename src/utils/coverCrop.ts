/** Profile covers are drawn about 3:1. 1500×500 stays sharp in the header. */
export const COVER_WIDTH = 1500;
export const COVER_HEIGHT = 500;

/**
 * Centre crop that matches `targetAspect` (width / height). Wider sources lose
 * their sides; taller sources lose their top and bottom.
 */
export const coverCropRect = (
  width: number,
  height: number,
  targetAspect = COVER_WIDTH / COVER_HEIGHT,
): { sx: number; sy: number; sw: number; sh: number } => {
  if (width <= 0 || height <= 0) return { sx: 0, sy: 0, sw: width, sh: height };
  const aspect = width / height;
  if (aspect > targetAspect) {
    const sw = height * targetAspect;
    return { sx: (width - sw) / 2, sy: 0, sw, sh: height };
  }
  const sh = width / targetAspect;
  return { sx: 0, sy: (height - sh) / 2, sw: width, sh };
};
