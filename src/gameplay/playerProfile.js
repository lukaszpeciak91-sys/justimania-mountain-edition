export const PLAYER_DISPLAY_SIZE = 140;
// Source-space Arcade body values compensate for the artwork-only scale pass,
// preserving the world-space body and its validated feet alignment from 118px.
export const PLAYER_COLLISION_BODY = Object.freeze({
  width: 220 * 118 / PLAYER_DISPLAY_SIZE,
  height: 432 * 118 / PLAYER_DISPLAY_SIZE,
  offsetX: 274 * 118 / PLAYER_DISPLAY_SIZE,
  offsetY: 251 * 118 / PLAYER_DISPLAY_SIZE,
});
// Stable world-space width of the validated Arcade collider. The sprite frame
// is 768px wide and rendered at PLAYER_DISPLAY_SIZE, so the display scaling
// cancels the source-space compensation used by PLAYER_COLLISION_BODY.
export const PLAYER_COLLISION_WORLD_WIDTH = 220 * 118 / 768;
export const PLAYER_VISIBLE_WRAP_WIDTH = 72;
export const PLAYER_START_POSITION = Object.freeze({ x: 195, y: 720 });
