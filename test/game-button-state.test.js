import test from 'node:test';
import assert from 'node:assert/strict';
import { createButtonPressState, gameButtonHitAreaBounds } from '../src/ui/gameButtonState.js';

test('button hit area spans the full Zone from its local top-left', () => {
  assert.deepEqual(gameButtonHitAreaBounds(220, 60), {
    x: 0,
    y: 0,
    width: 220,
    height: 60,
  });
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
