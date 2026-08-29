import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createMenuState, MENU_STATES } from '../src/ui/menuState.js';
import { EDITION_IDS } from '../src/config/editions.js';
import { clearSelectedEdition, selectEdition, selectedEdition } from '../src/config/editionState.js';
import { MENU_LAYOUT, menuControlLayout } from '../src/ui/menuLayout.js';

test('menu begins in its intentionally incomplete initial state', () => {
  assert.equal(createMenuState().value, MENU_STATES.INITIAL);
});

test('only the first tap begins the reveal', () => {
  const menu = createMenuState();
  assert.equal(menu.beginReveal(), true);
  assert.equal(menu.value, MENU_STATES.REVEALING);
  assert.equal(menu.beginReveal(), false);
  assert.equal(menu.value, MENU_STATES.REVEALING);
});

test('reveal completion makes the menu ready', () => {
  const menu = createMenuState();
  assert.equal(menu.completeReveal(), false);
  menu.beginReveal();
  assert.equal(menu.completeReveal(), true);
  assert.equal(menu.value, MENU_STATES.READY);
});

test('START becomes interactive only when the menu reaches READY', () => {
  const menu = createMenuState();
  assert.notEqual(menu.value, MENU_STATES.READY);
  menu.beginReveal();
  assert.notEqual(menu.value, MENU_STATES.READY);
  menu.completeReveal();
  assert.equal(menu.value, MENU_STATES.READY);
  menu.beginStart();
  assert.notEqual(menu.value, MENU_STATES.READY);
});

test('start is accepted once and only after reveal completion', () => {
  const menu = createMenuState();
  assert.equal(menu.beginStart(), false);
  menu.beginReveal();
  assert.equal(menu.beginStart(), false);
  menu.completeReveal();
  assert.equal(menu.beginStart(), true);
  assert.equal(menu.value, MENU_STATES.STARTING);
  assert.equal(menu.beginStart(), false);
});

test('index provides real START and BACK buttons hidden as one group', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<div id="menu-controls"[^>]* hidden>/);
  assert.match(html, /<button id="menu-start-button" type="button">START<\/button>/);
  assert.match(html, /<button id="menu-back-button" type="button">BACK<\/button>/);
});

test('MenuScene enables START and BACK together only after reveal completion', async () => {
  const source = await readFile(new URL('../src/scenes/MenuScene.js', import.meta.url), 'utf8');
  const showStart = source.match(/showStart\(\) \{[\s\S]*?\n  \}/)?.[0];

  assert.ok(showStart);
  assert.match(showStart, /if \(!this\.menuState\.completeReveal\(\)\) return;/);
  assert.match(showStart, /this\.input\.off\('pointerdown', this\.handleRevealTap\);[\s\S]*showMenuControls\(\(\) => this\.startGame\(\), \(\) => this\.returnToEditionSelect\(\)\)/);
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

test('BACK clears edition state and uses Phaser navigation without reloading', async () => {
  const values = new Map();
  const registry = { set: values.set.bind(values), get: values.get.bind(values), remove: values.delete.bind(values) };
  selectEdition(registry, 'beach');
  assert.equal(selectedEdition(registry).id, 'beach');
  clearSelectedEdition(registry);
  assert.equal(selectedEdition(registry).id, 'mountain');

  const source = await readFile(new URL('../src/scenes/MenuScene.js', import.meta.url), 'utf8');
  assert.match(source, /returnToEditionSelect\(\)[\s\S]*clearSelectedEdition\(this\.registry\)[\s\S]*this\.scene\.start\('EditionSelectScene'\)/);
  assert.doesNotMatch(source, /(?:window\.|globalThis\.)?location\.(?:reload|assign|replace)/);
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
