import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { MENU_FOREGROUND, menuForegroundEnabled, menuForegroundLayout } from '../src/ui/menuForeground.js';
import { MENU_STATES, createMenuState } from '../src/ui/menuState.js';

test('menu foreground layout preserves source aspect ratio with uniform scaling', () => {
  const layout = menuForegroundLayout(600, 900, 390, 844);
  assert.equal(layout.scaleX, layout.scaleY);
  assert.ok(600 * layout.scaleX <= 390 - MENU_FOREGROUND.edgePadding * 2);
  assert.ok(900 * layout.scaleY <= MENU_FOREGROUND.targetHeight);
});

test('menu foreground is anchored 48 logical pixels below the viewport bottom', () => {
  const viewportHeight = 844;
  const layout = menuForegroundLayout(600, 900, 390, viewportHeight);

  assert.equal(MENU_FOREGROUND.bottomPadding, -48);
  assert.equal(layout.y, viewportHeight + 48);
});

test('menu foreground is decorative and enters during the first-tap reveal phase', () => {
  assert.equal(MENU_FOREGROUND.interactive, false);
  assert.equal(MENU_FOREGROUND.revealPhase, MENU_STATES.REVEALING);
  const menu = createMenuState();
  assert.equal(menu.beginReveal(), true);
  assert.equal(menu.value, MENU_FOREGROUND.revealPhase);
});

test('missing foreground layout input does not affect menu progression', () => {
  assert.equal(menuForegroundLayout(0, 0, 390, 844), null);
  const menu = createMenuState();
  assert.equal(menu.beginReveal(), true);
  assert.equal(menu.completeReveal(), true);
  assert.equal(menu.beginStart(), true);
});

test('noforeground=1 disables menu foreground creation while other queries preserve it', () => {
  assert.equal(menuForegroundEnabled('?inputdebug=1&noforeground=1'), false);
  assert.equal(menuForegroundEnabled('?inputdebug=1'), true);
  assert.equal(menuForegroundEnabled(''), true);
  assert.equal(menuForegroundEnabled('?noforeground=0'), true);
});

test('menu scene records the foreground diagnostic branch before creating the foreground', () => {
  const source = readFileSync(new URL('../src/scenes/MenuScene.js', import.meta.url), 'utf8');
  assert.match(source, /if \(menuForegroundEnabled\(\)\) \{\s*inputDiagnostics\.record\('FOREGROUND_ACTIVE'\);\s*this\.createMenuForeground\(width, height\);\s*\} else \{\s*inputDiagnostics\.record\('FOREGROUND_DISABLED_BY_QUERY'\);\s*\}/);
});
