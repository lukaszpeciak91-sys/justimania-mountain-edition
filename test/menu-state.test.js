import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createMenuState, MENU_STATES } from '../src/ui/menuState.js';
import { EDITION_IDS } from '../src/config/editions.js';
import { MENU_LAYOUT, menuControlLayout } from '../src/ui/menuLayout.js';

test('menu begins ready and accepts start only once', () => {
  const menu = createMenuState();
  assert.equal(menu.value, MENU_STATES.READY);
  assert.equal(menu.beginStart(), true);
  assert.equal(menu.value, MENU_STATES.STARTING);
  assert.equal(menu.beginStart(), false);
});

test('index provides real PLAY and RETURN buttons hidden as one group', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<div id="menu-controls"[^>]* hidden>/);
  assert.match(html, /<button id="menu-start-button" type="button">PLAY<\/button>/);
  assert.match(html, /<button id="menu-back-button" type="button">RETURN<\/button>/);
});

test('MenuScene exposes PLAY and RETURN immediately without a reveal gate', async () => {
  const source = await readFile(new URL('../src/scenes/MenuScene.js', import.meta.url), 'utf8');

  assert.match(source, /create\(\) \{[\s\S]*showMenuControls\(\(\) => this\.startGame\(\), \(\) => this\.returnToEditionSelect\(\)\)/);
  assert.doesNotMatch(source, /pointerdown|beginReveal|completeReveal|revealMask|revealShape|showStart/);
  assert.deepEqual(EDITION_IDS, ['mountain', 'beach']);
  assert.equal(MENU_LAYOUT.startWidth, 190);
  assert.equal(MENU_LAYOUT.startHeight, 68);
  assert.equal(MENU_LAYOUT.backWidth, 190);
  assert.equal(MENU_LAYOUT.backHeight, 68);
});

test('MenuScene has no Phaser hit targets for START or BACK', async () => {
  const source = await readFile(new URL('../src/scenes/MenuScene.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /createGameButton|startButton|backButton|inputTarget/);
  assert.match(source, /cleanUp\(\)[\s\S]*hideMenuControls\(\)/);
});

test('START and BACK share the viewport center and BACK follows START', () => {
  const controls = menuControlLayout(390, 844);
  assert.deepEqual(controls.start, { x: 195, y: 422 });
  assert.deepEqual(controls.back, { x: 195, y: 500 });
  assert.equal(controls.start.x, controls.back.x);
  assert.ok(controls.back.y > controls.start.y);
  const startBottom = controls.start.y + MENU_LAYOUT.startHeight / 2;
  const backTop = controls.back.y - MENU_LAYOUT.backHeight / 2;
  assert.ok(backTop > startBottom);
});

test('BACK reloads through BootScene instead of starting EditionSelectScene directly', async () => {
  const source = await readFile(new URL('../src/scenes/MenuScene.js', import.meta.url), 'utf8');
  const backAction = source.match(/returnToEditionSelect\(\) \{[\s\S]*?\n  \}/)?.[0];

  assert.ok(backAction);
  assert.match(backAction, /window\.location\.reload\(\)/);
  assert.doesNotMatch(backAction, /this\.scene\.start\('EditionSelectScene'\)/);
  assert.doesNotMatch(source, /clearSelectedEdition/);
  assert.match(source, /startGame\(\)[\s\S]*this\.scene\.start\('GameScene', \{ editionId: this\.edition\.id \}\)/);
});

test('both editions use one shared START and foreground layout implementation', async () => {
  const source = await readFile(new URL('../src/scenes/MenuScene.js', import.meta.url), 'utf8');
  assert.match(source, /showMenuControls/);
  assert.match(source, /menuForegroundLayout\(source\.width, source\.height, width, height\)/);
  assert.doesNotMatch(source, /edition\.id === 'beach'[\s\S]{0,120}(?:startYRatio|menuForegroundLayout)/);
});

test('Mountain and Beach use the same centered control constants', () => {
  for (const editionId of EDITION_IDS) {
    assert.deepEqual(menuControlLayout(390, 844, editionId), menuControlLayout(390, 844));
  }
});
