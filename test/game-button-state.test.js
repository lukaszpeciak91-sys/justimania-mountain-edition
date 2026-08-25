import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createButtonPressState } from '../src/ui/gameButtonState.js';
import { createGameButton } from '../src/ui/gameButton.js';

function buttonScene() {
  const handlers = new Map();
  const chain = () => ({
    fillStyle() { return this; }, fillRoundedRect() { return this; }, lineStyle() { return this; }, strokeRoundedRect() { return this; },
    setOrigin() { return this; }, setScrollFactor() { return this; }, setDepth() { return this; }, setScale() { return this; },
    setAlpha() { return this; }, disableInteractive() { return this; }, removeAllListeners() { handlers.clear(); return this; },
    setInteractive() { this.input = {}; return this; }, on(event, callback) { handlers.set(event, callback); return this; }, destroy() {},
  });
  return {
    scene: { add: { graphics: chain, text: chain, container: chain, zone: chain } },
    pointerDown: () => handlers.get('pointerdown')(),
  };
}

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

test('optional button debug hook reports accepted and rejected presses without changing semantics', () => {
  const fixture = buttonScene();
  const stages = [];
  let presses = 0;
  createGameButton(fixture.scene, {
    x: 0, y: 0, label: 'TEST', width: 100, height: 40, fontSize: 20,
    onPress: () => { presses += 1; }, onDebug: (stage) => stages.push(stage),
  });

  fixture.pointerDown();
  fixture.pointerDown();

  assert.equal(presses, 1);
  assert.ok(stages.includes('PRESS_STATE_ACCEPTED'));
  assert.ok(stages.includes('PRESS_STATE_REJECTED'));
  assert.equal(stages.filter((stage) => stage === 'BUTTON_CALLBACK').length, 1);
});

test('omitting the button debug hook preserves accepted-then-rejected behavior', () => {
  const fixture = buttonScene();
  let presses = 0;
  createGameButton(fixture.scene, {
    x: 0, y: 0, label: 'TEST', width: 100, height: 40, fontSize: 20,
    onPress: () => { presses += 1; },
  });
  fixture.pointerDown();
  fixture.pointerDown();
  assert.equal(presses, 1);
});
