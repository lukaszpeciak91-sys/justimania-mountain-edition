import { BOOTSTRAP_JUMP_VELOCITY } from './difficulty.js';

export const PLAYER_FRAMES = Object.freeze({ idle: 0, jump: 1, fall: 2, land: 3 });
export const LAND_FRAME_MS = 130;

export function beginLandingVisual(player, now) {
  if (player.hasArt) player.setFrame(PLAYER_FRAMES.land);
  player.landingUntil = now + LAND_FRAME_MS;
  // The visual hold never gates the physical bounce.
  player.setVelocityY(BOOTSTRAP_JUMP_VELOCITY);
}

export function airborneFrameForVelocity(velocityY) {
  if (velocityY < -35) return PLAYER_FRAMES.jump;
  if (velocityY > 35) return PLAYER_FRAMES.fall;
  return PLAYER_FRAMES.idle;
}
