export const VICTORY_TIMING = Object.freeze({
  summitViewMs: 1000,
  celebrationMs: 1750,
  popupDelayMs: 2750,
});

export function victorySequenceEvents(timing = VICTORY_TIMING) {
  return Object.freeze([
    Object.freeze({ name: 'summit-landed', atMs: 0 }),
    Object.freeze({ name: 'celebration', atMs: timing.summitViewMs }),
    Object.freeze({ name: 'popup', atMs: timing.popupDelayMs }),
  ]);
}
