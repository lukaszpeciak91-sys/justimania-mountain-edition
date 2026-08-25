import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createButtonPressState } from '../src/ui/gameButtonState.js';

test('button uses the full Phaser-native Zone hit area', async () => {
  const source = await readFile(new URL('../src/ui/gameButton.js', import.meta.url), 'utf8');

  assert.match(source, /scene\.add\.zone\(x, y, width, height\)/);
  assert.match(source, /hitTarget\.setInteractive\(\)/);
  assert.doesNotMatch(source, /new Phaser\.Geom\.Rectangle/);
});

test('an enabled button accepts exactly one press', () => {
  let presses = 0;
  const state = createButtonPressState(() => { presses += 1; });

  state.enable();

  assert.equal(state.press(), true);
  assert.equal(state.press(), false);
  assert.equal(presses, 1);
});

test('a disabled button ignores presses', () => {
  let presses = 0;
  const state = createButtonPressState(() => { presses += 1; });

  state.enable();
  state.disable();

  assert.equal(state.press(), false);
  assert.equal(presses, 0);
});
