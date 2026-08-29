import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import {
  ASSETS,
  BEACH_ASSETS,
  BOOT_ASSETS,
  ensureAssetsLoaded,
  MOUNTAIN_ASSETS,
  SHARED_GAMEPLAY_ASSETS,
} from '../src/assets.js';

function loaderScene(existing = []) {
  const events = new EventEmitter();
  const requests = [];
  const load = Object.assign(events, {
    image(key, path) { requests.push({ type: 'image', key, path }); },
    spritesheet(key, path, frameConfig) {
      requests.push({ type: 'spritesheet', key, path, frameConfig });
    },
    start() { queueMicrotask(() => events.emit('complete')); },
  });
  return {
    requests,
    scene: {
      load,
      textures: { exists: (key) => existing.includes(key) },
      cache: { audio: { exists: () => false } },
    },
  };
}

const paths = (assets) => assets.map(({ path }) => path);

test('initial Boot has no blocking binary assets', () => {
  assert.deepEqual(BOOT_ASSETS, []);
});

test('edition batches contain shared assets and never cross-load presentation assets', () => {
  assert.deepEqual(paths(SHARED_GAMEPLAY_ASSETS), [
    'assets/backgrounds/game-sky.webp',
    'assets/ui/checkpoint-sign.png',
    'assets/ui/kaya-the-dog.png',
  ]);
  for (const asset of SHARED_GAMEPLAY_ASSETS) {
    assert.ok(MOUNTAIN_ASSETS.includes(asset));
    assert.ok(BEACH_ASSETS.includes(asset));
  }
  assert.ok(MOUNTAIN_ASSETS.includes(ASSETS.player));
  assert.ok(MOUNTAIN_ASSETS.includes(ASSETS.menuBackground));
  assert.ok(!MOUNTAIN_ASSETS.some(({ key }) => key.includes('beach')));
  assert.ok(BEACH_ASSETS.includes(ASSETS.beachPlayer));
  assert.ok(BEACH_ASSETS.includes(ASSETS.beachMenuBackground));
  assert.ok(!BEACH_ASSETS.includes(ASSETS.player));
  assert.ok(!BEACH_ASSETS.includes(ASSETS.platform));
  assert.ok(!BEACH_ASSETS.includes(ASSETS.menuBackground));
  assert.ok(!MOUNTAIN_ASSETS.includes(ASSETS.gameTheme));
  assert.ok(!BEACH_ASSETS.includes(ASSETS.gameTheme));
  assert.deepEqual(paths(MOUNTAIN_ASSETS), [
    'assets/backgrounds/menu-bg.webp',
    'assets/ui/menu-justyna-kaya.png',
    'assets/backgrounds/game-sky.webp',
    'assets/ui/checkpoint-sign.png',
    'assets/ui/kaya-the-dog.png',
    'assets/backgrounds/game-mountains-far.webp',
    'assets/backgrounds/game-mountains-mid.webp',
    'assets/player/justyna-sheet.png',
    'assets/platforms/platform-rock.png',
  ]);
  assert.deepEqual(paths(BEACH_ASSETS), [
    'assets/backgrounds/menu-beach-bg.webp',
    'assets/ui/menu-beach-justyna-kaya.png',
    'assets/backgrounds/game-sky.webp',
    'assets/ui/checkpoint-sign.png',
    'assets/ui/kaya-the-dog.png',
    'assets/backgrounds/game-beach-far.webp',
    'assets/backgrounds/game-beach-mid.webp',
    'assets/player/justyna-beach-sheet.png',
    'assets/platforms/platform-beach-sand.png',
  ]);
});

test('loader skips cached textures and preserves the player frame contract', async () => {
  const { scene, requests } = loaderScene([ASSETS.gameSky.key]);
  await ensureAssetsLoaded(scene, [ASSETS.gameSky, ASSETS.player]);
  assert.deepEqual(requests, [{
    type: 'spritesheet',
    key: 'justyna',
    path: 'assets/player/justyna-sheet.png',
    frameConfig: { frameWidth: 768, frameHeight: 768 },
  }]);
});

test('a failed optional Beach file still completes its loading batch', async () => {
  const { scene } = loaderScene();
  scene.load.start = function start() {
    queueMicrotask(() => {
      this.emit('loaderror', { key: ASSETS.beachMenuBackground.key, src: ASSETS.beachMenuBackground.path });
      this.emit('complete');
    });
  };
  await assert.doesNotReject(ensureAssetsLoaded(scene, [ASSETS.beachMenuBackground]));
});

test('selection and replay wait for edition loading before navigation', () => {
  const selection = readFileSync(new URL('../src/scenes/EditionSelectScene.js', import.meta.url), 'utf8');
  const boot = readFileSync(new URL('../src/scenes/BootScene.js', import.meta.url), 'utf8');
  assert.match(selection, /await ensureAssetsLoaded\(this, assetsForEdition\(edition\.id\)\);[\s\S]*start\('MenuScene'/);
  assert.match(boot, /consumeVictoryReplay\(\)[\s\S]*await ensureAssetsLoaded\(this, assetsForEdition\(replay\.editionId\)\);[\s\S]*start\('GameScene'/);
  assert.match(boot, /scene\.start\('EditionSelectScene'\)/);
});
