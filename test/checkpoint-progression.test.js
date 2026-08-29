import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CHECKPOINT_DECORATION_SPEC,
  CHECKPOINT_TEXT_LAYOUT,
  CHECKPOINT_VISUALS,
  FINAL_SUMMIT,
  MOUNTAIN_CHECKPOINTS,
  WORLD_DEPTH,
} from '../src/gameplay/checkpointData.js';
import { normalizedHeight } from '../src/gameplay/heightNormalization.js';
import { checkpointDecorationExclusionZones, checkpointLayerGeometry, CheckpointProgress, platformIntersectsBounds } from '../src/gameplay/CheckpointManager.js';
import { createRunState, enterVictory, gameplayIsActive, requestVictoryAction } from '../src/gameplay/runState.js';
import {
  generatePlatformLayer,
  horizontalOverlap,
  isOverheadClear,
  isRouteReachable,
  isWithinWorld,
  landablePassiveDepth,
  START_FLOOR_SPEC,
} from '../src/gameplay/difficulty.js';
import { PLAYER_DISPLAY_SIZE } from '../src/gameplay/playerProfile.js';
import { VICTORY_TIMING, victorySequenceEvents } from '../src/gameplay/victorySequence.js';

test('canonical mountain table contains exactly the Polish progression ending at Rysy', () => {
  const expected = [
    ['Trzy Korony', 982, 1200], ['Wysoka', 1050, 2600], ['Jaworzyna Krynicka', 1114, 4200],
    ['Mogielica', 1170, 6000], ['Skrzyczne', 1257, 8000], ['Radziejowa', 1267, 10400],
    ['Turbacz', 1310, 13100], ['Tarnica', 1346, 16100], ['Pilsko', 1557, 19500],
    ['Śnieżka', 1603, 23400], ['Babia Góra', 1723, 27700], ['Giewont', 1894, 32400],
    ['Kasprowy Wierch', 1987, 37500], ['Krzesanica', 2122, 43100],
    ['Starorobociański Wierch', 2176, 49100], ['Kozi Wierch', 2291, 55500],
    ['Świnica', 2301, 62500], ['Rysy', 2499, 70000],
  ];
  assert.equal(MOUNTAIN_CHECKPOINTS.length, 18);
  assert.equal(new Set(MOUNTAIN_CHECKPOINTS.map(({ id }) => id)).size, 18);
  assert.deepEqual(MOUNTAIN_CHECKPOINTS.map(({ name, elevationMeters, ascentThreshold }) =>
    [name, elevationMeters, ascentThreshold]), expected);
  MOUNTAIN_CHECKPOINTS.slice(1).forEach((item, index) => assert.ok(item.ascentThreshold > MOUNTAIN_CHECKPOINTS[index].ascentThreshold));
  assert.deepEqual(FINAL_SUMMIT, MOUNTAIN_CHECKPOINTS.at(-1));
  assert.equal(FINAL_SUMMIT.name, 'Rysy');
  assert.equal(FINAL_SUMMIT.elevationMeters, 2499);
  assert.equal(FINAL_SUMMIT.ascentThreshold, 70000);
  assert.equal(FINAL_SUMMIT.finalSummit, true);
  assert.equal(MOUNTAIN_CHECKPOINTS.filter(({ finalSummit }) => finalSummit).length, 1);
  assert.equal(normalizedHeight(FINAL_SUMMIT.ascentThreshold), 2499);
});

test('height normalization clamps and deterministically follows maximum ascent', () => {
  assert.equal(normalizedHeight(-50), 0);
  assert.equal(normalizedHeight(0), 0);
  assert.equal(normalizedHeight(450), 368);
  assert.equal(normalizedHeight(450), 368);
  assert.equal(normalizedHeight(FINAL_SUMMIT.ascentThreshold), 2499);
  assert.equal(normalizedHeight(FINAL_SUMMIT.ascentThreshold + 999), 2499);
  const values = [0, 100, 80, 1800, 1700, 9000].map((value, index, source) => normalizedHeight(Math.max(...source.slice(0, index + 1))));
  assert.deepEqual(values, [...values].sort((a, b) => a - b));
});

test('every authored height anchor maps exactly and normalization is monotonic', () => {
  MOUNTAIN_CHECKPOINTS.forEach(({ ascentThreshold, elevationMeters }) => {
    assert.equal(normalizedHeight(ascentThreshold), elevationMeters);
  });
  let previous = 0;
  for (let ascent = 0; ascent <= FINAL_SUMMIT.ascentThreshold; ascent += 37) {
    const height = normalizedHeight(ascent);
    assert.ok(height >= previous);
    previous = height;
  }
});

test('checkpoint state spawns and reaches each milestone exactly once in order', () => {
  const progress = new CheckpointProgress();
  MOUNTAIN_CHECKPOINTS.forEach((checkpoint) => {
    const platform = { y: 790 - checkpoint.ascentThreshold };
    assert.equal(progress.claimRoute(platform), checkpoint);
    assert.equal(progress.claimRoute(platform), null);
    assert.equal(progress.state(checkpoint.id), 'spawned');
    assert.equal(progress.reach(checkpoint.id), checkpoint);
    assert.equal(progress.reach(checkpoint.id), null);
  });
  const fresh = new CheckpointProgress();
  assert.ok(MOUNTAIN_CHECKPOINTS.every(({ id }) => fresh.state(id) === 'pending'));
});

test('checkpoint progression rejects out-of-order reaches', () => {
  const progress = new CheckpointProgress();
  progress.claimRoute({ y: 790 - 1200 });
  progress.claimRoute({ y: 790 - 2600 });
  assert.equal(progress.reach('wysoka'), null);
  assert.equal(progress.reach('trzy-korony')?.id, 'trzy-korony');
  assert.equal(progress.reach('wysoka')?.id, 'wysoka');
});

test('decoration spec is visual-only with dynamic sign and Kaya sheet metadata', () => {
  assert.equal(CHECKPOINT_DECORATION_SPEC.collision, false);
  assert.equal(CHECKPOINT_DECORATION_SPEC.sign.dynamicText, true);
  assert.equal(CHECKPOINT_DECORATION_SPEC.kaya.columns, 3);
  assert.deepEqual(CHECKPOINT_DECORATION_SPEC.kaya.sequence, [0, 1, 2, 1]);
  assert.equal(CHECKPOINT_DECORATION_SPEC.kaya.frameRate, 7);
});

test('checkpoint layer geometry is revalidated and removes secondaries', () => {
  const floor = { route: START_FLOOR_SPEC, platforms: [START_FLOOR_SPEC] };
  const previous = generatePlatformLayer(floor, 1, () => 0.42);
  const generated = generatePlatformLayer(previous, 2, () => 0.42);
  const safe = checkpointLayerGeometry(generated, previous, MOUNTAIN_CHECKPOINTS[0]);
  assert.equal(isRouteReachable(previous.route, safe.route), true);
  assert.ok(previous.platforms.every((platform) => isOverheadClear(platform, safe.route)));
  assert.deepEqual(safe.platforms, [safe.route]);
  assert.ok(safe.platforms.slice(1).every((secondary) => horizontalOverlap(secondary, safe.route) === 0));
});

test('checkpoint geometry supports a plain previous route without a layer wrapper', () => {
  const previousRoute = { x: 92, y: 500, width: 104, widthClass: 'short', role: 'route', layerId: 1 };
  const generated = generatePlatformLayer(previousRoute, 2, () => 0.42);
  const safe = checkpointLayerGeometry(generated, previousRoute, MOUNTAIN_CHECKPOINTS[0]);
  assert.equal(isRouteReachable(previousRoute, safe.route), true);
  assert.equal(safe.route.passiveDepth, landablePassiveDepth([previousRoute], safe.route));
});

test('Rysy route remains in bounds, uncluttered, wide, and reachable after summit treatment', () => {
  const previousRoute = { x: 76, y: 500, width: 104, role: 'route', layerId: 8 };
  const previous = { route: previousRoute, platforms: [previousRoute] };
  const generated = {
    route: { x: 166, y: 370, width: 104, role: 'route', layerId: 9 },
    platforms: [
      { x: 166, y: 370, width: 104, role: 'route', layerId: 9 },
      { x: 300, y: 370, width: 104, role: 'secondary', layerId: 9 },
    ],
  };
  const summit = checkpointLayerGeometry(generated, previous, FINAL_SUMMIT);
  assert.equal(summit.route.role, 'summit-route');
  assert.equal(summit.route.finalSummit, true);
  assert.ok(summit.route.width >= 142, 'summit is wider than late short ordinary platforms');
  assert.equal(isWithinWorld(summit.route), true);
  assert.equal(isRouteReachable(previous.route, summit.route), true);
  assert.ok(previous.platforms.every((platform) => isOverheadClear(platform, summit.route)));
  assert.deepEqual(summit.platforms, [summit.route]);
});

test('checkpoint exit generation clears sign and Kaya reservations and stays reachable', () => {
  const checkpoint = { x: 195, y: 0, width: 184, role: 'checkpoint-route', checkpointId: 'test' };
  const zones = checkpointDecorationExclusionZones(checkpoint);
  const layer = generatePlatformLayer({ route: checkpoint, platforms: [checkpoint] }, 2, () => 0.999999, undefined,
    { authoredAscent: 1000, exclusionZones: zones });
  assert.ok(isRouteReachable(checkpoint, layer.route));
  assert.ok(layer.platforms.every((platform) => zones.every((zone) => !platformIntersectsBounds(platform, zone))));
  assert.ok(layer.attempts <= 36);
});

test('40 seeded full routes spawn all checkpoints with clearance and reachable main routes', () => {
  for (let seed = 1; seed <= 40; seed += 1) {
    let state = seed;
    const random = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
    const progress = new CheckpointProgress();
    let previous = { route: START_FLOOR_SPEC, platforms: [START_FLOOR_SPEC] };
    let zones = [];
    for (let layerId = 1; layerId <= 650 && progress.nextIndex < MOUNTAIN_CHECKPOINTS.length; layerId += 1) {
      let layer = generatePlatformLayer(previous, layerId, random, undefined, {
        authoredAscent: 790 - previous.route.y,
        exclusionZones: zones,
      });
      const checkpoint = progress.checkpoints[progress.nextIndex];
      if (checkpoint && 790 - layer.route.y >= checkpoint.ascentThreshold) {
        layer = checkpointLayerGeometry(layer, previous, checkpoint);
        progress.claimRoute(layer.route);
        zones = [...progress.platforms.values()].flatMap(checkpointDecorationExclusionZones);
      }
      assert.ok(isRouteReachable(previous.route, layer.route));
      layer.platforms.forEach((platform) => zones.forEach((zone) => {
        if (platform.checkpointId !== zone.checkpointId) assert.equal(platformIntersectsBounds(platform, zone), false);
      }));
      previous = layer;
    }
    assert.equal(progress.nextIndex, MOUNTAIN_CHECKPOINTS.length);
    assert.equal(progress.state('rysy'), 'spawned');
  }
});

test('checkpoint visual scale and depth preserve the world hierarchy', () => {
  assert.ok(WORLD_DEPTH.checkpointDecoration > -16, 'decorations are in front of mountain backgrounds');
  assert.ok(WORLD_DEPTH.checkpointDecoration < WORLD_DEPTH.player, 'decorations are behind Justyna');
  assert.ok(WORLD_DEPTH.player < WORLD_DEPTH.hud, 'Justyna is behind the HUD');
  assert.equal(CHECKPOINT_VISUALS.kayaTargetHeight, 84);
  assert.equal(CHECKPOINT_VISUALS.signWidth, 122);
  assert.equal(CHECKPOINT_VISUALS.signHeight, 142);
  assert.equal(CHECKPOINT_TEXT_LAYOUT.mountainNameFontSize, 11);
  assert.equal(CHECKPOINT_TEXT_LAYOUT.longMountainNameFontSize, 9);
  assert.equal(CHECKPOINT_TEXT_LAYOUT.elevationFontSize, 9);
  assert.equal(CHECKPOINT_TEXT_LAYOUT.signTextAnchorY, -30);
  assert.equal(CHECKPOINT_TEXT_LAYOUT.textOffsetY, -2);
  assert.equal(CHECKPOINT_TEXT_LAYOUT.lineSpacing, 1);
  assert.ok(CHECKPOINT_TEXT_LAYOUT.signTextAnchorY + CHECKPOINT_TEXT_LAYOUT.textOffsetY < 0,
    'text targets the wooden arrow above the full asset center');
  assert.ok(CHECKPOINT_VISUALS.kayaTargetHeight < PLAYER_DISPLAY_SIZE);
  assert.ok(CHECKPOINT_VISUALS.signHeight >= PLAYER_DISPLAY_SIZE);
  assert.ok(CHECKPOINT_VISUALS.signHeight > CHECKPOINT_VISUALS.kayaTargetHeight);
  assert.ok(Math.abs(CHECKPOINT_VISUALS.signWidth / CHECKPOINT_VISUALS.signHeight - 1166 / 1349) < 0.01);
});

test('only a final summit landing enters victory and navigation is guarded', () => {
  const state = createRunState();
  assert.equal(enterVictory(state, false), false);
  assert.equal(gameplayIsActive(state), true);
  assert.equal(enterVictory(state, true), true);
  assert.equal(enterVictory(state, true), false);
  assert.equal(gameplayIsActive(state), false);
  assert.equal(requestVictoryAction(state, 'restart'), true);
  assert.equal(requestVictoryAction(state, 'restart'), false);
  assert.equal(requestVictoryAction(state, 'menu'), false);
  const menuState = createRunState();
  enterVictory(menuState, true);
  assert.equal(requestVictoryAction(menuState, 'menu'), true);
});

test('summit view and celebration precede the delayed victory popup', () => {
  assert.deepEqual(VICTORY_TIMING, { summitViewMs: 1000, celebrationMs: 1750, popupDelayMs: 2750 });
  assert.deepEqual(victorySequenceEvents().map(({ name, atMs }) => [name, atMs]), [
    ['summit-landed', 0], ['celebration', 1000], ['popup', 2750],
  ]);
  const gameScene = readFileSync(new URL('../src/scenes/GameScene.js', import.meta.url), 'utf8');
  const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(index, /RYSY • 2499 m/);
  assert.match(gameScene, /showVictoryModal\(formatRunTime\(this\.runElapsedMs\), this\.edition\.id\)/);
});
