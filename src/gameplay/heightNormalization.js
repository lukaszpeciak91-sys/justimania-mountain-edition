import { FINAL_SUMMIT, MOUNTAIN_CHECKPOINTS } from './checkpointData.js';

const ANCHORS = Object.freeze([
  Object.freeze({ ascent: 0, meters: 0 }),
  ...MOUNTAIN_CHECKPOINTS.map(({ ascentThreshold: ascent, elevationMeters: meters }) => Object.freeze({ ascent, meters })),
]);

/**
 * Piecewise-linear normalization over authored ascent/elevation anchors. World
 * units remain private gameplay coordinates; only this deterministic 0–2499 m
 * value is presented. Passing maximumAchievedAscent makes the result monotonic.
 */
export function normalizedHeight(maximumAchievedAscent) {
  const ascent = Math.max(0, Math.min(FINAL_SUMMIT.ascentThreshold, maximumAchievedAscent));
  const upperIndex = ANCHORS.findIndex((anchor) => anchor.ascent >= ascent);
  if (upperIndex <= 0) return 0;
  const lower = ANCHORS[upperIndex - 1];
  const upper = ANCHORS[upperIndex];
  const progress = (ascent - lower.ascent) / (upper.ascent - lower.ascent);
  return Math.floor(lower.meters + (upper.meters - lower.meters) * progress);
}
