import test from 'node:test';
import assert from 'node:assert/strict';
import {
  airborneFrameForVelocity,
  beginLandingVisual,
  LAND_FRAME_MS,
  PLAYER_FRAMES,
} from '../src/gameplay/playerAnimation.js';
import {
  BOOTSTRAP_GRAVITY,
  BOOTSTRAP_HORIZONTAL_SPEED,
  BOOTSTRAP_JUMP_VELOCITY,
} from '../src/gameplay/difficulty.js';

test('land frame contract remains readable without changing physics', () => {
  assert.equal(PLAYER_FRAMES.land, 3);
  assert.equal(LAND_FRAME_MS, 130);
  assert.equal(BOOTSTRAP_JUMP_VELOCITY, -570);
  assert.equal(BOOTSTRAP_GRAVITY, 1100);
  assert.equal(BOOTSTRAP_HORIZONTAL_SPEED, 205);
});

test('bounce applies velocity immediately while starting the visual land hold', () => {
  const events = [];
  const player = {
    hasArt: true,
    scene: { time: { now: 1000 } },
    setFrame(frame) { events.push(['frame', frame]); },
    setVelocityY(velocity) { events.push(['velocity', velocity]); },
  };
  beginLandingVisual(player, player.scene.time.now);
  assert.deepEqual(events, [['frame', PLAYER_FRAMES.land], ['velocity', BOOTSTRAP_JUMP_VELOCITY]]);
  assert.equal(player.landingUntil, 1000 + LAND_FRAME_MS);
});

test('land persists during hold, then ascent and descent select jump and fall', () => {
  const frames = [];
  const player = {
    hasArt: true,
    landingUntil: 1130,
    scene: { time: { now: 1129 } },
    body: { velocity: { y: BOOTSTRAP_JUMP_VELOCITY } },
    setFrame(frame) { frames.push(frame); },
  };
  if (player.scene.time.now >= player.landingUntil) player.setFrame(airborneFrameForVelocity(player.body.velocity.y));
  assert.deepEqual(frames, [], 'the already-selected LAND frame is retained');
  player.scene.time.now = 1130;
  if (player.scene.time.now >= player.landingUntil) player.setFrame(airborneFrameForVelocity(player.body.velocity.y));
  assert.equal(frames.at(-1), PLAYER_FRAMES.jump);
  player.body.velocity.y = 100;
  if (player.scene.time.now >= player.landingUntil) player.setFrame(airborneFrameForVelocity(player.body.velocity.y));
  assert.equal(frames.at(-1), PLAYER_FRAMES.fall);
  assert.equal(airborneFrameForVelocity(0), PLAYER_FRAMES.idle);
});
