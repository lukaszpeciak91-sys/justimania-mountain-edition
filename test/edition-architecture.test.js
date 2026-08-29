import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { EDITION_IDS, EDITIONS } from '../src/config/editions.js';

test('the stable edition contract contains exactly mountain and beach', () => {
  assert.deepEqual(EDITION_IDS, ['mountain', 'beach']);
  assert.deepEqual(Object.keys(EDITIONS), EDITION_IDS);
});

test('Mountain keeps canonical assets and both editions share the sky', () => {
  const mountain = EDITIONS.mountain;
  const beach = EDITIONS.beach;
  assert.equal(mountain.menuBackground.path, 'assets/backgrounds/menu-bg.webp');
  assert.equal(mountain.menuForeground.path, 'assets/ui/menu-justyna-kaya.png');
  assert.equal(mountain.gameplay.sky.path, 'assets/backgrounds/game-sky.webp');
  assert.equal(mountain.gameplay.far.path, 'assets/backgrounds/game-mountains-far.webp');
  assert.equal(mountain.gameplay.mid.path, 'assets/backgrounds/game-mountains-mid.webp');
  assert.equal(mountain.gameplay.platform.path, 'assets/platforms/platform-rock.png');
  assert.equal(beach.gameplay.sky.path, mountain.gameplay.sky.path);
  assert.notEqual(beach.gameplay.far.path, mountain.gameplay.far.path);
  assert.notEqual(beach.gameplay.mid.path, mountain.gameplay.mid.path);
  assert.equal(beach.gameplay.platformFallback, mountain.gameplay.platform);
});

test('selection and START explicitly forward the selected edition', () => {
  const select = readFileSync(new URL('../src/scenes/EditionSelectScene.js', import.meta.url), 'utf8');
  const menu = readFileSync(new URL('../src/scenes/MenuScene.js', import.meta.url), 'utf8');
  assert.match(select, /start\('MenuScene', \{ editionId: edition\.id \}\)/);
  assert.match(menu, /start\('GameScene', \{ editionId: this\.edition\.id \}\)/);
});

test('missing Beach presentation layers are guarded and scene variants are not duplicated', () => {
  const background = readFileSync(new URL('../src/gameplay/BackgroundManager.js', import.meta.url), 'utf8');
  const menu = readFileSync(new URL('../src/scenes/MenuScene.js', import.meta.url), 'utf8');
  assert.match(background, /if \(!textureAvailable\(this\.scene, config\.asset\)\) return/);
  assert.match(menu, /textureAvailable\(this, menuBackground\)/);
  const scenes = readdirSync(new URL('../src/scenes/', import.meta.url));
  assert.deepEqual(scenes.filter((name) => name.endsWith('GameScene.js')), ['GameScene.js']);
  assert.deepEqual(scenes.filter((name) => name.endsWith('MenuScene.js')), ['MenuScene.js']);
});
