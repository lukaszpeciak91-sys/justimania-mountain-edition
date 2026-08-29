import test from 'node:test';
import assert from 'node:assert/strict';
import {
  airborneTimeAtHeight,
  DIFFICULTY_BANDS,
  FINAL_WORLD_ASCENT,
  generatePlatformLayer,
  horizontalAllowance,
  horizontalVelocityAfter,
  visiblePlatformWidth,
  horizontalOverlap,
  isPassiveTransition,
  isRouteReachable,
  landablePassiveDepth,
  passiveChainLength,
  PLATFORM_GENERATION,
  routeOverlapRatio,
  directionHistoryAccepts,
  secondaryCandidateIsSafe,
  stationaryLandingCorridorWidth,
  START_FLOOR_SPEC,
} from '../src/gameplay/difficulty.js';
import { PLAYER_COLLISION_WORLD_WIDTH } from '../src/gameplay/playerProfile.js';
import {
  checkpointDecorationExclusionZones,
  checkpointLayerGeometry,
  CheckpointProgress,
} from '../src/gameplay/CheckpointManager.js';

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

test('normalized route overlap is width-aware', () => {
  assert.equal(routeOverlapRatio({ x: 100, width: 100 }, { x: 175, width: 200 }), 0.75);
  assert.equal(routeOverlapRatio({ x: 0, width: 100 }, { x: 200, width: 100 }), 0);
});

test('stationary landing corridor derives from the validated player collider', () => {
  assert.ok(PLAYER_COLLISION_WORLD_WIDTH > 33 && PLAYER_COLLISION_WORLD_WIDTH < 34);
  const touching = { x: 100, width: 100 };
  const same = { x: 100, width: 100 };
  assert.ok(Math.abs(stationaryLandingCorridorWidth(touching, same) - (100 - PLAYER_COLLISION_WORLD_WIDTH)) < 1e-9);

  const visuallySeparated = { x: 210, width: 100 };
  assert.equal(horizontalOverlap(touching, visuallySeparated), 0);
  assert.equal(stationaryLandingCorridorWidth(touching, visuallySeparated), 0);
});

test('passive detection uses meaningful player-aware landing tolerance', () => {
  const lower = { x: 100, width: 142 };
  const upper = { x: 184, width: 142 };
  assert.ok(horizontalOverlap(lower, upper) < 64);
  assert.ok(routeOverlapRatio(lower, upper) < 0.5);
  assert.ok(stationaryLandingCorridorWidth(lower, upper) < PLAYER_COLLISION_WORLD_WIDTH * 1.65);
  assert.equal(isPassiveTransition(lower, upper), false);
});

test('horizontal control accelerates, drags, reverses, and remains speed bounded', () => {
  assert.equal(horizontalVelocityAfter(0, 1, 1 / 60), 15);
  assert.equal(horizontalVelocityAfter(205, 0, 1 / 60), 185);
  assert.equal(horizontalVelocityAfter(205, -1, 1 / 60), 190);
  assert.ok(horizontalVelocityAfter(205, -1, 1 / 60) > 0, 'reversal takes finite time');
  assert.equal(horizontalVelocityAfter(0, 1, 10), 205);
  assert.ok(horizontalAllowance(117.5) < airborneTimeAtHeight(117.5) * 205 * PLATFORM_GENERATION.horizontalSafety);
});

test('bands centralize decreasing overlap and corridor targets', () => {
  assert.deepEqual(DIFFICULTY_BANDS.map((band) => band.maxPreferredOverlap), [0.72, 0.55, 0.50, 0.46]);
  assert.deepEqual(DIFFICULTY_BANDS.map((band) => band.maxStationaryCorridor), [72, 52, 44, 38]);
  assert.deepEqual(DIFFICULTY_BANDS.map((band) => band.maxPassiveChain), [1, 1, 1, 1]);
});

test('secondary anti-ladder rule checks every physically landable lower platform', () => {
  const lower = { x: 100, width: 104, passiveDepth: 1 };
  const candidate = { x: 110, width: 104 };
  assert.equal(landablePassiveDepth([lower], candidate), 2);
  assert.equal(secondaryCandidateIsSafe(candidate, [lower], DIFFICULTY_BANDS[2]), false);
  assert.equal(secondaryCandidateIsSafe(candidate, [lower], DIFFICULTY_BANDS[0]), false);
});

test('passive-chain and direction memory remain bounded without forced alternation', () => {
  const lower = { x: 100, width: 120 };
  const upper = { x: 120, width: 120 };
  assert.equal(isPassiveTransition(lower, upper), true);
  assert.equal(passiveChainLength([{ passive: true }, { passive: true }], lower, upper), 3);
  assert.equal(directionHistoryAccepts([{ direction: 1 }, { direction: 1 }, { direction: 1 }], 1), false);
  assert.equal(directionHistoryAccepts([{ direction: -1 }, { direction: 1 }, { direction: -1 }], 1), false);
  assert.equal(directionHistoryAccepts([{ direction: -1 }, { direction: 1 }, { direction: -1 }], -1), true);
});

test('seeded ordinary geometry uses both edge-overhang regions without wrap-required jumps', () => {
  let nearestLeft = Infinity;
  let nearestRight = -Infinity;
  for (let seed = 1; seed <= 50; seed += 1) {
    const random = seededRandom(seed);
    let previous = { route: START_FLOOR_SPEC, platforms: [START_FLOOR_SPEC] };
    for (let layerId = 1; layerId <= 300; layerId += 1) {
      const layer = generatePlatformLayer(previous, layerId, random);
      assert.ok(isRouteReachable(previous.route, layer.route), 'normal distance keeps every main jump reachable');
      for (const platform of layer.platforms) {
        const left = platform.x - platform.width / 2;
        const right = platform.x + platform.width / 2;
        nearestLeft = Math.min(nearestLeft, left);
        nearestRight = Math.max(nearestRight, right);
        assert.ok(left >= -PLATFORM_GENERATION.edgeOverhang);
        assert.ok(right <= 390 + PLATFORM_GENERATION.edgeOverhang);
        assert.ok(visiblePlatformWidth(platform) / platform.width >= PLATFORM_GENERATION.minVisibleRatio);
      }
      previous = layer;
    }
  }
  console.log('Deterministic edge usage:', { nearestLeft, nearestRight });
  assert.ok(nearestLeft < PLATFORM_GENERATION.worldMargin);
  assert.ok(nearestRight > 390 - PLATFORM_GENERATION.worldMargin);
});

test('100 deterministic playable courses preserve variety and suppress landable ladders', () => {
  const totals = Object.fromEntries(DIFFICULTY_BANDS.map(({ id }) => [id, {
    layers: 0, visualOverlap: 0, corridor: 0, landableTransitions: 0, passiveTransitions: 0,
    displacement: 0, allowanceFraction: 0, centeredZeroInput: 0, secondaryLayers: 0,
    longestPassive: 0, widths: { short: 0, medium: 0, long: 0 }, stages: [0, 0, 0, 0],
  }]));

  for (let seed = 1; seed <= 100; seed += 1) {
    const random = seededRandom(seed);
    const checkpoints = new CheckpointProgress();
    let zones = [];
    let previous = { id: 0, route: START_FLOOR_SPEC, platforms: [{ ...START_FLOOR_SPEC, passiveDepth: 0 }], routeHistory: [] };
    let ascent = 0;
    while (ascent < FINAL_WORLD_ASCENT) {
      let layer = generatePlatformLayer(previous, previous.id + 1, random, undefined, { authoredAscent: ascent, exclusionZones: zones });
      const checkpoint = checkpoints.checkpoints[checkpoints.nextIndex];
      if (checkpoint && 790 - layer.route.y >= checkpoint.ascentThreshold) {
        layer = checkpointLayerGeometry(layer, previous, checkpoint);
        checkpoints.claimRoute(layer.route);
        zones = [...checkpoints.platforms.values()].flatMap(checkpointDecorationExclusionZones);
      }

      const stats = totals[layer.difficultyBand];
      stats.layers += 1;
      stats.visualOverlap += routeOverlapRatio(previous.route, layer.route);
      stats.corridor += stationaryLandingCorridorWidth(previous.route, layer.route);
      stats.displacement += Math.abs(layer.route.x - previous.route.x);
      stats.allowanceFraction += Math.abs(layer.route.x - previous.route.x)
        / horizontalAllowance(previous.route.y - layer.route.y);
      stats.centeredZeroInput += Math.abs(layer.route.x - previous.route.x)
        <= (layer.route.width - PLAYER_COLLISION_WORLD_WIDTH) / 2 ? 1 : 0;
      stats.secondaryLayers += layer.platforms.length > 1 ? 1 : 0;
      stats.widths[layer.route.widthClass] += 1;
      stats.stages[layer.fallbackStage] += 1;
      for (const upper of layer.platforms) {
        stats.longestPassive = Math.max(stats.longestPassive, upper.passiveDepth ?? 0);
        for (const lower of previous.platforms) {
          if (stationaryLandingCorridorWidth(lower, upper) <= 0) continue;
          stats.landableTransitions += 1;
          stats.passiveTransitions += isPassiveTransition(lower, upper) ? 1 : 0;
        }
      }
      previous = layer;
      ascent = 790 - layer.route.y;
      assert.ok(layer.attempts <= PLATFORM_GENERATION.candidateRetries * 2);
    }
    assert.equal(checkpoints.nextIndex, 18);
  }

  const summary = Object.fromEntries(Object.entries(totals).map(([id, value]) => [id, {
    averageVisualOverlap: value.visualOverlap / value.layers,
    averageStationaryCorridor: value.corridor / value.layers,
    passiveLandableRate: value.passiveTransitions / value.landableTransitions,
    longestPassiveChain: value.longestPassive,
    widthDistribution: Object.fromEntries(Object.entries(value.widths).map(([name, count]) => [name, count / value.layers])),
    averageDisplacement: value.displacement / value.layers,
    averageReachFraction: value.allowanceFraction / value.layers,
    centeredZeroInputRate: value.centeredZeroInput / value.layers,
    secondaryLayerDensity: value.secondaryLayers / value.layers,
    fallbackStageDistribution: value.stages.map((count) => count / value.layers),
  }]));
  console.log('Generator V4 player-aware 100-seed statistics:', JSON.stringify(summary));

  assert.ok(summary['high-mountains'].widthDistribution.medium > 0.15);
  assert.ok(summary['summit-push'].widthDistribution.medium > 0.12);
  assert.ok(summary['climb'].widthDistribution.short < 0.9);
  assert.ok(summary['summit-push'].averageStationaryCorridor < summary.intro.averageStationaryCorridor);
  assert.ok(summary['summit-push'].passiveLandableRate < summary.intro.passiveLandableRate);
  assert.ok(summary.climb.centeredZeroInputRate < 0.35);
  assert.ok(summary['high-mountains'].centeredZeroInputRate < 0.25);
  assert.ok(summary['summit-push'].centeredZeroInputRate < 0.20);
  assert.ok(summary.intro.secondaryLayerDensity > summary['summit-push'].secondaryLayerDensity);
  assert.ok(summary.intro.longestPassiveChain <= 2);
  assert.ok(summary['high-mountains'].longestPassiveChain <= 2);
  assert.ok(summary['summit-push'].longestPassiveChain <= 2);
  assert.ok(Object.values(summary).every(({ fallbackStageDistribution }) => fallbackStageDistribution[3] < 0.35));
  assert.ok(summary['high-mountains'].fallbackStageDistribution[2] + summary['high-mountains'].fallbackStageDistribution[3] < 0.25);
  assert.ok(summary['summit-push'].fallbackStageDistribution[2] + summary['summit-push'].fallbackStageDistribution[3] < 0.25);
});
