import test from 'node:test';
import assert from 'node:assert/strict';
import { basename } from 'node:path';
import { readFileSync } from 'node:fs';
import { ASSETS } from '../src/assets.js';
import { EDITIONS } from '../src/config/editions.js';
import {
  BEACH_CHECKPOINTS,
  checkpointSignLines,
  MOUNTAIN_CHECKPOINTS,
} from '../src/gameplay/checkpointData.js';
import { PLAYER_FRAMES } from '../src/gameplay/playerAnimation.js';
import { PLATFORM_COLLIDER_HEIGHT, PLATFORM_HEIGHT } from '../src/gameplay/PlatformManager.js';
import {
  CHECKPOINT_BASELINES,
  checkpointDecorationBaselines,
  checkpointDecorationExclusionZones,
} from '../src/gameplay/CheckpointManager.js';

test('final Beach assets use exact unique canonical paths', () => {
  assert.deepEqual({
    player: ASSETS.beachPlayer.path,
    menuBackground: ASSETS.beachMenuBackground.path,
    far: ASSETS.beachFar.path,
    mid: ASSETS.beachMid.path,
    menuForeground: ASSETS.beachMenuForeground.path,
    platform: ASSETS.beachPlatform.path,
  }, {
    player: 'assets/player/justyna-beach-sheet.png',
    menuBackground: 'assets/backgrounds/menu-beach-bg.webp',
    far: 'assets/backgrounds/game-beach-far.webp',
    mid: 'assets/backgrounds/game-beach-mid.webp',
    menuForeground: 'assets/ui/menu-beach-justyna-kaya.png',
    platform: 'assets/platforms/platform-beach-sand.png',
  });
  const pairs = [
    [ASSETS.player, ASSETS.beachPlayer], [ASSETS.menuBackground, ASSETS.beachMenuBackground],
    [ASSETS.mountainsFar, ASSETS.beachFar], [ASSETS.mountainsMid, ASSETS.beachMid],
    [ASSETS.menuForeground, ASSETS.beachMenuForeground], [ASSETS.platform, ASSETS.beachPlatform],
  ];
  pairs.forEach(([mountain, beach]) => assert.notEqual(basename(mountain.path), basename(beach.path)));
});

test('edition gameplay selects player, backgrounds, and platform with fallbacks', () => {
  assert.equal(EDITIONS.mountain.gameplay.player, ASSETS.player);
  assert.equal(EDITIONS.beach.gameplay.player, ASSETS.beachPlayer);
  assert.equal(EDITIONS.beach.gameplay.playerFallback, ASSETS.player);
  assert.equal(EDITIONS.mountain.gameplay.platform, ASSETS.platform);
  assert.equal(EDITIONS.beach.gameplay.platform, ASSETS.beachPlatform);
  assert.equal(EDITIONS.beach.gameplay.platformFallback, ASSETS.platform);
  assert.equal(EDITIONS.mountain.gameplay.sky, EDITIONS.beach.gameplay.sky);
  assert.notEqual(EDITIONS.mountain.gameplay.far, EDITIONS.beach.gameplay.far);
  assert.notEqual(EDITIONS.mountain.gameplay.mid, EDITIONS.beach.gameplay.mid);
  assert.deepEqual(PLAYER_FRAMES, { idle: 0, jump: 1, fall: 2, land: 3 });
  assert.equal(PLATFORM_HEIGHT, 57);
  assert.equal(PLATFORM_COLLIDER_HEIGHT, 14);
  const player = readFileSync(new URL('../src/gameplay/Player.js', import.meta.url), 'utf8');
  assert.match(player, /textureAvailable\(scene, playerAsset\) \? playerAsset : fallbackAsset/);
});

test('Beach checkpoints run east to west to Świnoujście with names only', () => {
  assert.equal(BEACH_CHECKPOINTS.length, 18);
  assert.deepEqual(BEACH_CHECKPOINTS.map(({ ascentThreshold }) => ascentThreshold),
    MOUNTAIN_CHECKPOINTS.map(({ ascentThreshold }) => ascentThreshold));
  assert.equal(BEACH_CHECKPOINTS.at(-1).name, 'Świnoujście');
  assert.equal(BEACH_CHECKPOINTS.at(-1).finalSummit, true);
  assert.deepEqual(BEACH_CHECKPOINTS.slice(0, 4).map(({ name }) => name),
    ['Krynica Morska', 'Hel', 'Jurata', 'Jastarnia']);
  BEACH_CHECKPOINTS.forEach((checkpoint) => {
    assert.deepEqual(checkpointSignLines(checkpoint, 'beach'), [checkpoint.name.toLocaleUpperCase('pl-PL')]);
    assert.doesNotMatch(checkpointSignLines(checkpoint, 'beach').join(' '), /\d|\bm\b|km/i);
    assert.equal('elevationMeters' in checkpoint, false);
  });
  assert.deepEqual(checkpointSignLines(MOUNTAIN_CHECKPOINTS.at(-1), 'mountain'), ['RYSY', '2499 m']);
});

test('Beach checkpoint decoration grounding is edition presentation only', () => {
  const mountainOffset = EDITIONS.mountain.presentation.checkpointDecorationOffsetY;
  const beachOffset = EDITIONS.beach.presentation.checkpointDecorationOffsetY;
  assert.equal(mountainOffset, 0);
  assert.notEqual(beachOffset, mountainOffset);
  const mountainBaselines = checkpointDecorationBaselines(mountainOffset);
  const beachBaselines = checkpointDecorationBaselines(beachOffset);
  assert.equal(beachBaselines.signCenter - mountainBaselines.signCenter, beachOffset);
  assert.equal(beachBaselines.kayaBottom - mountainBaselines.kayaBottom, beachOffset);

  const platform = { checkpointId: 'test', x: 100, y: 300, width: 184 };
  const mountainZones = checkpointDecorationExclusionZones(platform, mountainOffset);
  const beachZones = checkpointDecorationExclusionZones(platform, beachOffset);
  mountainZones.forEach((zone, index) => {
    assert.equal(beachZones[index].top - zone.top, beachOffset);
    assert.equal(beachZones[index].bottom - zone.bottom, beachOffset);
    assert.equal(beachZones[index].left, zone.left);
    assert.equal(beachZones[index].right, zone.right);
  });

  assert.deepEqual(CHECKPOINT_BASELINES, {
    geometricArtworkBottom: -26.5,
    geometricSignCenter: -97.5,
    signCenter: -71.5,
    kayaBottom: -2.5,
  });
  assert.equal(ASSETS.checkpointSign.path, 'assets/ui/checkpoint-sign.png');
  assert.equal(ASSETS.kaya.path, 'assets/ui/kaya-the-dog.png');
});
