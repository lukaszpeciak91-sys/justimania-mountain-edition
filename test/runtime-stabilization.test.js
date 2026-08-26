import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BOOT_ASSETS } from '../src/assets.js';
import { CHECKPOINT_BASELINES } from '../src/gameplay/CheckpointManager.js';
import { CHECKPOINT_VISUALS } from '../src/gameplay/checkpointData.js';
import { PLATFORM_HEIGHT } from '../src/gameplay/PlatformManager.js';
import { FONT_READY_TIMEOUT_MS, waitForRequiredFonts } from '../src/ui/fontReady.js';

test('GameScene freezes gameplay and shows the DOM game-over modal exactly once', async () => {
  const source = await readFile(new URL('../src/scenes/GameScene.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /physics\.pause\(\)/);
  assert.match(source, /if \(!gameplayIsActive\(this\.runState\)\)/);
  assert.match(source, /showGameOver\(\)[\s\S]*setVelocity\(0, 0\)[\s\S]*setAllowGravity\(false\)/);
  assert.match(source, /if \(!enterGameOver\(this\.runState\)\) return;[\s\S]*touchDirection = 0;[\s\S]*disableTouchZones\(\)[\s\S]*setVelocity\(0, 0\)[\s\S]*setAcceleration\(0, 0\)[\s\S]*setAllowGravity\(false\)[\s\S]*scene\.pause\('GameScene'\);[\s\S]*showGameOverModal/);
  assert.doesNotMatch(source, /label: 'RESTART'/);
  assert.doesNotMatch(source, /performGameOverAction|gameOverButtons|gameOverObjects/);
  assert.doesNotMatch(source, /createGameButton[\s\S]*RUN OVER|launch\('GameOverScene'\)/);
  assert.match(source, /requestVictoryAction\(this\.runState, action\)/);
});

test('Phaser config excludes GameOverScene and MENU uses Scene Manager APIs', async () => {
  const config = await readFile(new URL('../src/config.js', import.meta.url), 'utf8');
  const game = await readFile(new URL('../src/scenes/GameScene.js', import.meta.url), 'utf8');
  assert.doesNotMatch(config, /GameOverScene/);
  assert.match(config, /scene: \[BootScene, MenuScene, GameScene\]/);
  const returnToMenu = game.match(/returnToMenuAfterGameOver\(\) \{([\s\S]*?)\n  \}/)?.[1] ?? '';
  assert.match(returnToMenu, /if \(this\.gameOverNavigating\) return;[\s\S]*hideGameOverModal\(\);[\s\S]*this\.scene\.start\('MenuScene'\);/);
  assert.equal(returnToMenu.match(/this\.scene\.(?:start|stop)\(/g)?.length, 1);
  assert.doesNotMatch(returnToMenu, /this\.scene\.stop\('GameScene'\)/);
  assert.match(game, /cleanUp\(\) \{[\s\S]*hideGameOverModal\(\)/);
});

test('index owns one native MENU button in a hidden modal outside the game shell', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal(html.match(/id="game-over-menu-button"/g)?.length, 1);
  assert.match(html, /<\/main>\s*<div id="game-over-modal"[^>]*hidden>/);
  assert.match(html, /<button id="game-over-menu-button" type="button">MENU<\/button>/);
  assert.doesNotMatch(html, /RESTART/);
});

test('boot excludes gameplay audio and GameScene starts it lazily', async () => {
  assert.equal(BOOT_ASSETS.some(({ type }) => type === 'audio'), false);
  const boot = await readFile(new URL('../src/scenes/BootScene.js', import.meta.url), 'utf8');
  const menu = await readFile(new URL('../src/scenes/MenuScene.js', import.meta.url), 'utf8');
  const game = await readFile(new URL('../src/scenes/GameScene.js', import.meta.url), 'utf8');
  assert.doesNotMatch(boot, /load\.audio/);
  assert.doesNotMatch(menu, /game-theme|loadGameplayMusic|load\.audio|await/);
  assert.match(game, /loadGameplayMusic\(\)/);
  assert.match(game, /filecomplete-audio-/);
  assert.match(game, /FILE_LOAD_ERROR/);
  assert.match(game, /assets\/audio\/game-theme\.mp3|ASSETS\.gameTheme\.path/);
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

test('checkpoint artwork applies explicit asset compensation to platform geometry', () => {
  const geometricBottom = -PLATFORM_HEIGHT / 2 + CHECKPOINT_VISUALS.platformTopOverlap;
  const geometricSignCenter = geometricBottom - CHECKPOINT_VISUALS.signHeight / 2;
  assert.equal(CHECKPOINT_BASELINES.geometricArtworkBottom, geometricBottom);
  assert.equal(CHECKPOINT_BASELINES.geometricSignCenter, geometricSignCenter);
  assert.equal(CHECKPOINT_BASELINES.signCenter, geometricSignCenter + CHECKPOINT_VISUALS.signVisualDrop);
  assert.equal(CHECKPOINT_BASELINES.kayaBottom, geometricBottom + CHECKPOINT_VISUALS.kayaVisualDrop);
  assert.equal(CHECKPOINT_BASELINES.signTextCenter, CHECKPOINT_BASELINES.signCenter - 1);
  assert.deepEqual({
    geometricBottom,
    signVisualDrop: CHECKPOINT_VISUALS.signVisualDrop,
    signCenter: CHECKPOINT_BASELINES.signCenter,
    kayaVisualDrop: CHECKPOINT_VISUALS.kayaVisualDrop,
    kayaBottom: CHECKPOINT_BASELINES.kayaBottom,
    signTextCenter: CHECKPOINT_BASELINES.signTextCenter,
  }, {
    geometricBottom: -22,
    signVisualDrop: 22,
    signCenter: -59,
    kayaVisualDrop: 20,
    kayaBottom: -2,
    signTextCenter: -60,
  });
});
