import test from 'node:test';
import assert from 'node:assert/strict';
import AscentTracker from '../src/gameplay/AscentTracker.js';
import {
  airborneTimeAtHeight,
  BOOTSTRAP_GRAVITY,
  BOOTSTRAP_HORIZONTAL_SPEED,
  BOOTSTRAP_JUMP_VELOCITY,
  DIFFICULTY_BANDS,
  difficultyBandAt,
  estimateCleanRunDuration,
  generatePlatformLayer,
  horizontalAllowance,
  isOverheadClear,
  isRouteReachable,
  PLATFORM_GENERATION,
  START_FLOOR_SPEC,
} from '../src/gameplay/difficulty.js';
import { PLAYER_COLLISION_BODY, PLAYER_DISPLAY_SIZE, PLAYER_START_POSITION } from '../src/gameplay/playerProfile.js';
import { PLATFORM_COLLIDER_HEIGHT, PLATFORM_HEIGHT } from '../src/gameplay/PlatformManager.js';
import { fellBelowCamera, wrappedHorizontalPosition } from '../src/gameplay/worldWrap.js';
import { mountainLayerState } from '../src/gameplay/BackgroundManager.js';
import {
  createRunState,
  enterGameOver,
  gameplayIsActive,
} from '../src/gameplay/runState.js';

test('ascent only increases at a new highest position', () => {
  const ascent = new AscentTracker(720);
  assert.equal(ascent.update(700), 20);
  assert.equal(ascent.update(715), 20);
  assert.equal(ascent.update(640.2), 79);
});

test('generation limits remain conservative for the portrait world', () => {
  assert.ok(PLATFORM_GENERATION.verticalGapMin >= 100);
  assert.ok(PLATFORM_GENERATION.verticalGapMax >= 128);
  assert.ok(PLATFORM_GENERATION.verticalGapMax <= 132);
  assert.ok(PLATFORM_GENERATION.widthMin >= 100);
  assert.ok(PLATFORM_GENERATION.widthMax < 390 - PLATFORM_GENERATION.worldMargin * 2);
});

test('horizontal allowance follows airborne time with a touch control margin', () => {
  const lowerGapAllowance = horizontalAllowance(105);
  const higherGapAllowance = horizontalAllowance(130);
  assert.ok(airborneTimeAtHeight(105) > airborneTimeAtHeight(130));
  assert.ok(lowerGapAllowance > higherGapAllowance);
  assert.ok(lowerGapAllowance < airborneTimeAtHeight(105) * 205);
  assert.ok(higherGapAllowance >= 90, 'bootstrap gaps retain useful horizontal variety');
});

function seededRandom(seed = 0x12345678) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

test('layer generator preserves a deterministic guaranteed route and world margins', () => {
  const random = seededRandom();
  let previous = { route: START_FLOOR_SPEC, platforms: [START_FLOOR_SPEC] };
  const widthClasses = new Map();
  for (let layerId = 1; layerId <= 120; layerId += 1) {
    const layer = generatePlatformLayer(previous, layerId, random);
    assert.equal(layer.platforms.filter(({ role }) => role === 'route').length, 1);
    assert.ok(isRouteReachable(previous.route, layer.route));
    previous.platforms.forEach((lower) => assert.ok(isOverheadClear(lower, layer.route)));
    layer.platforms.forEach((platform) => {
      assert.ok(platform.x - platform.width / 2 >= PLATFORM_GENERATION.worldMargin);
      assert.ok(platform.x + platform.width / 2 <= 390 - PLATFORM_GENERATION.worldMargin);
    });
    layer.platforms.forEach(({ widthClass }) => {
      widthClasses.set(widthClass, (widthClasses.get(widthClass) ?? 0) + 1);
    });
    previous = layer;
  }
  assert.ok(widthClasses.has('short'));
  assert.ok(widthClasses.has('long'));
});

test('authored progress selects increasingly demanding centralized bands', () => {
  assert.deepEqual([0, 12000, 24000, 36000, 48000].map((ascent) => difficultyBandAt(ascent).id),
    ['intro', 'climb', 'high-mountains', 'summit-push', 'summit-push']);
  assert.equal(DIFFICULTY_BANDS.length, 4);
  assert.ok(DIFFICULTY_BANDS[0].widthWeights.long > DIFFICULTY_BANDS[3].widthWeights.long);
  assert.ok(DIFFICULTY_BANDS[0].secondaryChances[1] > DIFFICULTY_BANDS[3].secondaryChances[1]);
  assert.ok(DIFFICULTY_BANDS[0].horizontalStepRange[1] < DIFFICULTY_BANDS[3].horizontalStepRange[1]);
});

test('hundreds of seeded banded layers stay reachable with bounded retries', () => {
  for (let seed = 1; seed <= 40; seed += 1) {
    const random = seededRandom(seed);
    let previous = { route: START_FLOOR_SPEC, platforms: [START_FLOOR_SPEC] };
    for (let layerId = 1; layerId <= 400; layerId += 1) {
      const layer = generatePlatformLayer(previous, layerId, random);
      assert.ok(isRouteReachable(previous.route, layer.route));
      assert.ok(layer.attempts <= PLATFORM_GENERATION.candidateRetries);
      previous = layer;
    }
  }
});

test('clean-run estimate documents a seven-minute theoretical lower bound', () => {
  const estimate = estimateCleanRunDuration();
  assert.equal(estimate.finalAscent, 48000);
  assert.equal(estimate.typicalVerticalGap, 117.5);
  assert.ok(estimate.seconds >= 420 && estimate.seconds <= 600);
});

test('width-aware overhead rules reject close ceilings and allow open corridors', () => {
  const longLower = { x: 195, y: 500, width: 200 };
  assert.equal(isOverheadClear(longLower, { x: 195, y: 380, width: 200 }), false);
  assert.equal(isOverheadClear(longLower, { x: 230, y: 380, width: 200 }), false);
  assert.equal(isOverheadClear(longLower, { x: 295, y: 380, width: 104 }), true, 'offset short target leaves a corridor');
  assert.equal(isOverheadClear(longLower, { x: 195, y: 350, width: 200 }), true, 'large vertical separation permits overlap');
});

test('candidate retries are bounded and deterministic fallback remains safe', () => {
  const layer = generatePlatformLayer(START_FLOOR_SPEC, 1, () => 0.999999);
  assert.equal(layer.attempts, PLATFORM_GENERATION.candidateRetries);
  assert.equal(layer.usedFallback, true);
  assert.ok(isRouteReachable(START_FLOOR_SPEC, layer.route));
});

test('secondary candidates clear every platform in the previous layer', () => {
  const previousRoute = { x: 100, y: 500, width: 104, role: 'route', layerId: 1 };
  const previousSecondary = { x: 280, y: 500, width: 104, role: 'secondary', layerId: 1 };
  // Route: gap 120, short width 104, right step 94. Then request one short
  // secondary at x=299: clear of the route, but an unsafe ceiling above the
  // preceding secondary. It must be omitted rather than retried indefinitely.
  const values = [0.58, 0.1, 0, 0.9, 0.78, 0.5, 0.1, 0.1, 0, 0.937];
  let index = 0;
  const layer = generatePlatformLayer({
    route: previousRoute,
    platforms: [previousRoute, previousSecondary],
  }, 2, () => values[index++]);

  const rejectedCandidate = { x: 299, y: layer.route.y, width: 104 };
  assert.equal(isOverheadClear(previousRoute, rejectedCandidate), true);
  assert.equal(isOverheadClear(previousSecondary, rejectedCandidate), false);
  assert.deepEqual(layer.platforms, [layer.route]);
});

test('dedicated full-width floor safely bootstraps the first route layer', () => {
  assert.equal(START_FLOOR_SPEC.width, 390);
  assert.equal(START_FLOOR_SPEC.x, 195);
  assert.equal(START_FLOOR_SPEC.role, 'start-floor');
  assert.ok(START_FLOOR_SPEC.width > PLATFORM_GENERATION.widthMax);
  assert.equal(PLAYER_START_POSITION.x, START_FLOOR_SPEC.x);
  assert.ok(PLAYER_START_POSITION.y < START_FLOOR_SPEC.y);
  const firstLayer = generatePlatformLayer(START_FLOOR_SPEC, 1, seededRandom(7));
  assert.ok(isRouteReachable(START_FLOOR_SPEC, firstLayer.route));
});

test('larger rendered player preserves bootstrap physics constants', () => {
  assert.equal(PLAYER_DISPLAY_SIZE, 140);
  assert.deepEqual(PLAYER_COLLISION_BODY, {
    width: 220 * 118 / 140,
    height: 432 * 118 / 140,
    offsetX: 274 * 118 / 140,
    offsetY: 251 * 118 / 140,
  });
  assert.equal(PLAYER_COLLISION_BODY.width * 140 / 118, 220);
  assert.equal(PLAYER_COLLISION_BODY.height * 140 / 118, 432);
  assert.equal(PLATFORM_HEIGHT, 57);
  assert.equal(PLATFORM_COLLIDER_HEIGHT, 14);
  assert.equal(BOOTSTRAP_HORIZONTAL_SPEED, 205);
  assert.equal(BOOTSTRAP_GRAVITY, 1100);
  assert.equal(BOOTSTRAP_JUMP_VELOCITY, -570);
});

test('platform generation geometry remains at its validated values', () => {
  assert.deepEqual({
    verticalGapMin: PLATFORM_GENERATION.verticalGapMin,
    verticalGapMax: PLATFORM_GENERATION.verticalGapMax,
    widthMin: PLATFORM_GENERATION.widthMin,
    widthMax: PLATFORM_GENERATION.widthMax,
    widthBands: PLATFORM_GENERATION.widthBands,
    worldMargin: PLATFORM_GENERATION.worldMargin,
  }, {
    verticalGapMin: 105,
    verticalGapMax: 130,
    widthMin: 104,
    widthMax: 210,
    widthBands: [
      { name: 'short', min: 104, max: 128, weight: 0.50 },
      { name: 'medium', min: 142, max: 168, weight: 0.35 },
      { name: 'long', min: 184, max: 210, weight: 0.15 },
    ],
    worldMargin: 24,
  });
});

test('horizontal wrap crosses both directions without changing velocity', () => {
  const velocity = -205;
  assert.equal(wrappedHorizontalPosition(-37, 72, 390), 426);
  assert.equal(velocity, -205);
  assert.equal(wrappedHorizontalPosition(427, 72, 390), -36);
  assert.equal(velocity, -205);
  assert.equal(wrappedHorizontalPosition(0, 72, 390), 0, 'does not wrap while still visible');
  assert.equal(fellBelowCamera(500, 0), false, 'horizontal crossing cannot cause game over');
  assert.equal(fellBelowCamera(921, 0), true, 'falling below the camera still causes game over');
});

test('game over enters once and stops gameplay updates', () => {
  const state = createRunState();
  assert.equal(gameplayIsActive(state), true);
  assert.equal(enterGameOver(state), true);
  assert.equal(enterGameOver(state), false);
  assert.equal(gameplayIsActive(state), false);
});

test('a fresh run resets game over and camera progress', () => {
  const oldRun = createRunState();
  oldRun.highestCameraY = -2400;
  enterGameOver(oldRun);
  const freshRun = createRunState();
  assert.deepEqual(freshRun, {
    gameOver: false,
    victory: false,
    victoryAction: { status: 'idle', action: null },
    highestCameraY: 0,
  });
});

test('game over gates gameplay', () => {
  const state = createRunState();
  enterGameOver(state);
  assert.equal(gameplayIsActive(state), false);
});

test('mountain compositions crossfade with finite, overlapping positions', () => {
  const config = { factor: 0.12, interval: 1200 };
  for (const cameraY of [0, -500, -1199, -1200, -12000]) {
    const states = mountainLayerState(cameraY, config);
    assert.equal(states.length, 2);
    assert.ok(states.every(({ alpha, yOffset }) => Number.isFinite(yOffset) && alpha >= 0 && alpha <= 1));
    assert.ok(Math.abs(states[0].alpha + states[1].alpha - 1) < Number.EPSILON * 4);
    assert.equal(states[1].composition, states[0].composition + 1);
  }
});
