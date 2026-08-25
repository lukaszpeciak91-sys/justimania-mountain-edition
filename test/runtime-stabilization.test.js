import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BOOT_ASSETS } from '../src/assets.js';
import { CHECKPOINT_BASELINES } from '../src/gameplay/CheckpointManager.js';
import { CHECKPOINT_VISUALS } from '../src/gameplay/checkpointData.js';
import { PLATFORM_HEIGHT } from '../src/gameplay/PlatformManager.js';
import { FONT_READY_TIMEOUT_MS, waitForRequiredFonts } from '../src/ui/fontReady.js';

test('terminal overlays gate gameplay and freeze the player without pausing physics', async () => {
  const source = await readFile(new URL('../src/scenes/GameScene.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /physics\.pause\(\)/);
  assert.match(source, /if \(!gameplayIsActive\(this\.runState\)\)/);
  assert.match(source, /showGameOver\(\)[\s\S]*setVelocity\(0, 0\)[\s\S]*setAllowGravity\(false\)/);
  assert.match(source, /requestGameOverAction\(this\.runState, action\)/);
  assert.match(source, /requestVictoryAction\(this\.runState, action\)/);
  assert.match(source, /scene\.start\(action === 'restart' \? 'GameScene' : 'MenuScene'\)/);
});

test('boot excludes gameplay audio and GameScene starts it lazily', async () => {
  assert.equal(BOOT_ASSETS.some(({ type }) => type === 'audio'), false);
  const boot = await readFile(new URL('../src/scenes/BootScene.js', import.meta.url), 'utf8');
  const game = await readFile(new URL('../src/scenes/GameScene.js', import.meta.url), 'utf8');
  assert.doesNotMatch(boot, /load\.audio/);
  assert.match(game, /loadGameplayMusic\(\)/);
  assert.match(game, /filecomplete-audio-/);
});

test('existing Google fonts are bounded by a font-ready gate before Phaser starts', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(html, /fonts\.googleapis\.com[\s\S]*family=Bungee/);
  assert.match(html, /family=Barlow\+Condensed/);
  assert.match(main, /await waitForRequiredFonts\(document\.fonts\)[\s\S]*new Phaser\.Game/);
  assert.ok(FONT_READY_TIMEOUT_MS >= 2500 && FONT_READY_TIMEOUT_MS <= 3000);
});

test('font-ready gate requests both faces and continues after failures', async () => {
  const requested = [];
  await waitForRequiredFonts({
    load(spec) { requested.push(spec); return Promise.reject(new Error('offline')); },
    ready: Promise.resolve(),
  }, 20);
  assert.deepEqual(requested, ['45px Bungee', 'italic 700 24px "Barlow Condensed"']);
});

test('checkpoint artwork baselines derive from platform geometry', () => {
  const expectedBottom = -PLATFORM_HEIGHT / 2 + CHECKPOINT_VISUALS.platformTopOverlap;
  assert.equal(CHECKPOINT_BASELINES.artworkBottom, expectedBottom);
  assert.equal(CHECKPOINT_BASELINES.signCenter, expectedBottom - CHECKPOINT_VISUALS.signHeight / 2);
  assert.equal(CHECKPOINT_BASELINES.artworkBottom, -22);
  assert.equal(CHECKPOINT_BASELINES.signCenter, -81);
});
