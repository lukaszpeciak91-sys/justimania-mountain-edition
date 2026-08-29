import test from 'node:test';
import assert from 'node:assert/strict';
import {
  airborneTimeAtHeight,
  centeredZeroInputLanding,
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
  passiveChainState,
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
  assert.ok(Math.abs(stationaryLandingCorridorWidth(touching, same) - (100 + PLAYER_COLLISION_WORLD_WIDTH)) < 1e-9);

  const visuallySeparated = { x: 210, width: 100 };
  assert.equal(horizontalOverlap(touching, visuallySeparated), 0);
  assert.ok(stationaryLandingCorridorWidth(touching, visuallySeparated) > 0,
    'collider overlap permits an Arcade landing despite a visual gap');
});

test('passive detection uses meaningful player-aware landing tolerance', () => {
  const lower = { x: 100, width: 142 };
  const upper = { x: 184, width: 142 };
  assert.ok(horizontalOverlap(lower, upper) < 64);
  assert.ok(routeOverlapRatio(lower, upper) < 0.5);
  assert.ok(stationaryLandingCorridorWidth(lower, upper) >= PLAYER_COLLISION_WORLD_WIDTH * 1.8);
  assert.equal(centeredZeroInputLanding(lower, upper), true);
  assert.equal(isPassiveTransition(lower, upper), true);
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
  assert.deepEqual(DIFFICULTY_BANDS.map((band) => band.maxStationaryCorridor), [90, 75, 68, 62]);
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

test('passive depth requires one meaningful stationary corridor across the whole chain', () => {
  const first = { x: 100, width: 104, passiveDepth: 0 };
  const secondState = passiveChainState([first], { x: 160, width: 104 });
  const second = {
    x: 160, width: 104, passiveDepth: secondState.depth,
    passiveChainLeft: secondState.left, passiveChainRight: secondState.right,
  };
  assert.equal(second.passiveDepth, 1);
  assert.equal(isPassiveTransition(second, { x: 220, width: 104 }), true,
    'the next pair still has a broad collision-aware corridor');
  assert.equal(passiveChainState([second], { x: 220, width: 104 }).depth, 0,
    'the shifting pairwise corridors do not share one zero-input position across all three ledges');
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
    longestPassive: 0, longestAlternating: 0, longestSameDirection: 0, alternatingExtensions: 0,
    widths: { short: 0, medium: 0, long: 0 }, stages: [0, 0, 0, 0],
  }]));

  for (let seed = 1; seed <= 100; seed += 1) {
    const random = seededRandom(seed);
    const checkpoints = new CheckpointProgress();
    let zones = [];
    let previous = { id: 0, route: START_FLOOR_SPEC, platforms: [{ ...START_FLOOR_SPEC, passiveDepth: 0 }], routeHistory: [] };
    let ascent = 0;
    let previousDirection = 0;
    let previousBand = null;
    let alternatingRun = 0;
    let sameDirectionRun = 0;
    while (ascent < FINAL_WORLD_ASCENT) {
      let layer = generatePlatformLayer(previous, previous.id + 1, random, undefined, { authoredAscent: ascent, exclusionZones: zones });
      const checkpoint = checkpoints.checkpoints[checkpoints.nextIndex];
      if (checkpoint && 790 - layer.route.y >= checkpoint.ascentThreshold) {
        layer = checkpointLayerGeometry(layer, previous, checkpoint);
        checkpoints.claimRoute(layer.route);
        zones = [...checkpoints.platforms.values()].flatMap(checkpointDecorationExclusionZones);
      }
      assert.ok(isRouteReachable(previous.route, layer.route),
        'every full-course route remains reachable directly without wrap');

      const stats = totals[layer.difficultyBand];
      const direction = Math.sign(layer.route.x - previous.route.x);
      if (previousBand !== layer.difficultyBand) {
        alternatingRun = 1;
        sameDirectionRun = 1;
      } else if (direction === previousDirection) {
        sameDirectionRun += 1;
        alternatingRun = 1;
      } else {
        alternatingRun += 1;
        sameDirectionRun = 1;
      }
      stats.longestAlternating = Math.max(stats.longestAlternating, alternatingRun);
      stats.longestSameDirection = Math.max(stats.longestSameDirection, sameDirectionRun);
      stats.alternatingExtensions += alternatingRun >= 4 ? 1 : 0;
      stats.layers += 1;
      stats.visualOverlap += routeOverlapRatio(previous.route, layer.route);
      stats.corridor += stationaryLandingCorridorWidth(previous.route, layer.route);
      stats.displacement += Math.abs(layer.route.x - previous.route.x);
      stats.allowanceFraction += Math.abs(layer.route.x - previous.route.x)
        / horizontalAllowance(previous.route.y - layer.route.y);
      stats.centeredZeroInput += centeredZeroInputLanding(previous.route, layer.route) ? 1 : 0;
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
      previousBand = layer.difficultyBand;
      previousDirection = direction;
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
    longestAlternatingDirectionRun: value.longestAlternating,
    longestSameDirectionRun: value.longestSameDirection,
    strictAlternationExtensionRate: value.alternatingExtensions / value.layers,
    fallbackStageDistribution: value.stages.map((count) => count / value.layers),
  }]));
  console.log('Generator V4 player-aware 100-seed statistics:', JSON.stringify(summary));

  assert.ok(summary['high-mountains'].widthDistribution.medium > 0.10);
  assert.ok(summary['summit-push'].widthDistribution.medium > 0.10);
  assert.ok(Object.values(summary).every(({ widthDistribution }) => widthDistribution.short < 0.88));
  assert.ok(summary.intro.widthDistribution.long > 0.03);
  assert.ok(summary.climb.widthDistribution.medium > 0.10);
  assert.ok(summary['summit-push'].averageStationaryCorridor < summary.intro.averageStationaryCorridor);
  assert.ok(summary['summit-push'].passiveLandableRate < summary.intro.passiveLandableRate);
  assert.ok(summary.climb.centeredZeroInputRate < 0.35);
  assert.ok(summary['high-mountains'].centeredZeroInputRate < 0.25);
  assert.ok(summary['summit-push'].centeredZeroInputRate < 0.20);
  assert.ok(DIFFICULTY_BANDS.slice(1).every((_, index) => (
    summary[DIFFICULTY_BANDS[index].id].secondaryLayerDensity
      > summary[DIFFICULTY_BANDS[index + 1].id].secondaryLayerDensity
  )));
  assert.ok(Object.values(summary).every(({ secondaryLayerDensity }) => secondaryLayerDensity > 0.015));
  assert.ok(Object.values(summary).every(({ longestAlternatingDirectionRun }) => longestAlternatingDirectionRun <= 7));
  assert.ok(Object.values(summary).every(({ strictAlternationExtensionRate }) => strictAlternationExtensionRate < 0.10));
  assert.ok(Object.values(summary).every(({ longestSameDirectionRun }) => longestSameDirectionRun <= 4));
  assert.ok(Object.values(summary).every(({ longestPassiveChain }) => longestPassiveChain <= 2));
  assert.ok(summary.intro.fallbackStageDistribution[3] < 0.22);
  assert.ok(summary.climb.fallbackStageDistribution[3] < 0.15);
  assert.ok(summary['high-mountains'].fallbackStageDistribution[3] < 0.12);
  assert.ok(summary['summit-push'].fallbackStageDistribution[3] < 0.10);
});
