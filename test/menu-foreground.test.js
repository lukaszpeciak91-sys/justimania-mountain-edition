import assert from 'node:assert/strict';
import test from 'node:test';
import { MENU_FOREGROUND, menuForegroundLayout } from '../src/ui/menuForeground.js';
import { MENU_STATES, createMenuState } from '../src/ui/menuState.js';

test('menu foreground layout preserves source aspect ratio with uniform scaling', () => {
  const layout = menuForegroundLayout(600, 900, 390, 844);
  assert.equal(layout.scaleX, layout.scaleY);
  assert.ok(600 * layout.scaleX <= 390 - MENU_FOREGROUND.edgePadding * 2);
  assert.ok(900 * layout.scaleY <= MENU_FOREGROUND.targetHeight);
});

test('menu foreground finishes four logical pixels above the viewport bottom', () => {
  const viewportHeight = 844;
  const layout = menuForegroundLayout(600, 900, 390, viewportHeight);

  assert.equal(MENU_FOREGROUND.bottomPadding, 4);
  assert.equal(layout.y, viewportHeight - 4);
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
