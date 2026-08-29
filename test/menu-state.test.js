import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createMenuState, MENU_STATES } from '../src/ui/menuState.js';
import { EDITION_IDS } from '../src/config/editions.js';
import { clearSelectedEdition, selectEdition, selectedEdition } from '../src/config/editionState.js';
import { MENU_LAYOUT } from '../src/ui/menuLayout.js';

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

test('MenuScene keeps START disabled until reveal completion enables it', async () => {
  const source = await readFile(new URL('../src/scenes/MenuScene.js', import.meta.url), 'utf8');
  assert.match(source, /interactive: false/);
  assert.match(source, /showStart\(reducedMotion\)[\s\S]*this\.startButton\.enable\(\)/);
});

test('MenuScene exposes an immediately interactive shared BACK button for both editions', async () => {
  const source = await readFile(new URL('../src/scenes/MenuScene.js', import.meta.url), 'utf8');
  assert.match(source, /this\.backButton = createGameButton/);
  assert.match(source, /label: 'BACK'/);
  assert.doesNotMatch(source, /backButton[\s\S]*interactive: false/);
  assert.deepEqual(EDITION_IDS, ['mountain', 'beach']);
  assert.equal(MENU_LAYOUT.backWidth, 116);
  assert.equal(MENU_LAYOUT.backHeight, 54);
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
  assert.match(source, /height \* MENU_LAYOUT\.startYRatio/);
  assert.match(source, /menuForegroundLayout\(source\.width, source\.height, width, height\)/);
  assert.doesNotMatch(source, /edition\.id === 'beach'[\s\S]{0,120}(?:startYRatio|menuForegroundLayout)/);
});
