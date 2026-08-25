import test from 'node:test';
import assert from 'node:assert/strict';
import { createButtonPressState } from '../src/ui/gameButtonState.js';

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
