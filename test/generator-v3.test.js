import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIFFICULTY_BANDS,
  FINAL_WORLD_ASCENT,
  generatePlatformLayer,
  isPassiveTransition,
  passiveChainLength,
  PLATFORM_GENERATION,
  routeOverlapRatio,
  directionHistoryAccepts,
  START_FLOOR_SPEC,
} from '../src/gameplay/difficulty.js';

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

test('bands centralize decreasing overlap targets and passive limits', () => {
  assert.deepEqual(DIFFICULTY_BANDS.map((band) => band.maxPreferredOverlap), [0.62, 0.42, 0.27, 0.17]);
  assert.deepEqual(DIFFICULTY_BANDS.map((band) => band.maxPassiveChain), [2, 1, 1, 1]);
});

test('passive-chain and direction memory reject repetitive geometry without forced alternation', () => {
  const lower = { x: 100, width: 120 };
  const upper = { x: 120, width: 120 };
  assert.equal(isPassiveTransition(lower, upper), true);
  assert.equal(passiveChainLength([{ passive: true }, { passive: true }], lower, upper), 3);
  assert.equal(directionHistoryAccepts([{ direction: 1 }, { direction: 1 }, { direction: 1 }], 1), false);
  assert.equal(directionHistoryAccepts([{ direction: -1 }, { direction: 1 }, { direction: -1 }], 1), false);
  assert.equal(directionHistoryAccepts([{ direction: -1 }, { direction: 1 }, { direction: -1 }], -1), true);
});

test('100 deterministic full courses become more lateral with bounded fallback', () => {
  const totals = Object.fromEntries(DIFFICULTY_BANDS.map(({ id }) => [id, {
    count: 0, overlap: 0, highOverlap: 0, displacement: 0, directionChanges: 0,
    comparableDirections: 0, longestPassive: 0, fallback: 0,
  }]));
  for (let seed = 1; seed <= 100; seed += 1) {
    const random = seededRandom(seed);
    let previous = { route: START_FLOOR_SPEC, platforms: [START_FLOOR_SPEC], routeHistory: [] };
    let ascent = 0;
    let chain = 0;
    while (ascent < FINAL_WORLD_ASCENT) {
      const layer = generatePlatformLayer(previous, previous.id + 1 || 1, random, undefined, { authoredAscent: ascent });
      const stats = totals[layer.difficultyBand];
      const overlap = routeOverlapRatio(previous.route, layer.route);
      const direction = Math.sign(layer.route.x - previous.route.x);
      const priorDirection = previous.routeHistory.at(-1)?.direction;
      stats.count += 1;
      stats.overlap += overlap;
      stats.highOverlap += overlap > 0.5 ? 1 : 0;
      stats.displacement += Math.abs(layer.route.x - previous.route.x);
      if (priorDirection) {
        stats.comparableDirections += 1;
        stats.directionChanges += direction !== priorDirection ? 1 : 0;
      }
      chain = isPassiveTransition(previous.route, layer.route) ? chain + 1 : 0;
      stats.longestPassive = Math.max(stats.longestPassive, chain);
      stats.fallback += layer.fallbackStage > 0 ? 1 : 0;
      previous = layer;
      ascent = 790 - layer.route.y;
      assert.ok(layer.attempts <= PLATFORM_GENERATION.candidateRetries * 2);
    }
  }
  const summary = Object.fromEntries(Object.entries(totals).map(([id, value]) => [id, {
    averageOverlap: value.overlap / value.count,
    highOverlapRate: value.highOverlap / value.count,
    averageDisplacement: value.displacement / value.count,
    directionChangeRate: value.directionChanges / value.comparableDirections,
    longestPassiveChain: value.longestPassive,
    fallbackRate: value.fallback / value.count,
  }]));
  console.log('Generator V3 100-seed statistics:', JSON.stringify(summary));
  assert.ok(summary['summit-push'].averageOverlap < summary.intro.averageOverlap);
  assert.ok(summary['summit-push'].highOverlapRate < summary.intro.highOverlapRate);
  assert.ok(summary['summit-push'].averageDisplacement > summary.intro.averageDisplacement);
  assert.ok(summary['high-mountains'].longestPassiveChain <= 1);
  assert.ok(summary['summit-push'].longestPassiveChain <= 1);
  assert.ok(Object.values(summary).every(({ directionChangeRate }) => directionChangeRate > 0.2 && directionChangeRate < 0.8));
});
