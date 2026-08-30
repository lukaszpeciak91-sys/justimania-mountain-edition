import assert from 'node:assert/strict';
import test from 'node:test';
import { MENU_FOREGROUND, menuForegroundLayout } from '../src/ui/menuForeground.js';
import { MENU_LAYOUT } from '../src/ui/menuLayout.js';

test('menu foreground layout preserves source aspect ratio with uniform scaling', () => {
  const layout = menuForegroundLayout(600, 900, 390, 844);
  assert.equal(layout.scaleX, layout.scaleY);
  assert.ok(600 * layout.scaleX <= 390 - MENU_FOREGROUND.edgePadding * 2);
  assert.ok(900 * layout.scaleY <= MENU_FOREGROUND.targetHeight);
});

test('shared menu layout moves START and foreground upward while preserving a safe gap', () => {
  const viewportHeight = 844;
  const layout = menuForegroundLayout(600, 900, 390, viewportHeight);

  assert.equal(MENU_LAYOUT.startYRatio, 0.5);
  assert.equal(MENU_FOREGROUND.bottomPadding, -32);
  assert.equal(layout.y, viewportHeight + 32);
  const backBottom = viewportHeight * MENU_LAYOUT.startYRatio + MENU_LAYOUT.backGap + MENU_LAYOUT.backHeight / 2;
  const foregroundTop = layout.y - 900 * layout.scaleY;
  assert.ok(foregroundTop > backBottom);
});

test('shared foreground target moves artwork toward the horizontal center', () => {
  assert.ok(MENU_FOREGROUND.targetX >= 205 && MENU_FOREGROUND.targetX <= 220);
  assert.notEqual(MENU_FOREGROUND.targetX, 275);
  assert.equal(menuForegroundLayout(200, 900, 390, 844).x, MENU_FOREGROUND.targetX);
});

test('menu foreground is decorative and has a short automatic entrance', () => {
  assert.equal(MENU_FOREGROUND.interactive, false);
  assert.equal(MENU_FOREGROUND.entranceOffset, 22);
  assert.equal(MENU_FOREGROUND.duration, 420);
});

test('missing foreground layout input is handled safely', () => {
  assert.equal(menuForegroundLayout(0, 0, 390, 844), null);
});
