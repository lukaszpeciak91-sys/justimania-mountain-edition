import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGameButton } from '../src/ui/gameButton.js';

function buttonScene() {
  const objects = [];
  const makeObject = (properties = {}) => {
    const handlers = new Map();
    return Object.assign({
      handlers,
      input: null,
      destroyed: false,
      fillStyle() { return this; },
      fillRoundedRect() { return this; },
      lineStyle() { return this; },
      strokeRoundedRect() { return this; },
      setOrigin() { return this; },
      setScrollFactor() { return this; },
      setDepth() { return this; },
      setScale(scale) { this.scale = scale; return this; },
      setAlpha(alpha) { this.alpha = alpha; return this; },
      setInteractive() { this.input = { enabled: true }; return this; },
      disableInteractive() { if (this.input) this.input.enabled = false; return this; },
      on(event, callback) { handlers.set(event, callback); return this; },
      emit(event) { if (this.input?.enabled) handlers.get(event)?.(); },
      destroy() { this.destroyed = true; },
    }, properties);
  };
  const add = {
    graphics() { return makeObject(); },
    text() { return makeObject(); },
    container(x, y) { return makeObject({ x, y, type: 'Container' }); },
    rectangle(x, y, width, height) {
      const object = makeObject({ x, y, width, height, type: 'Rectangle' });
      objects.push(object);
      return object;
    },
    zone() { throw new Error('shared game buttons must not create a Zone'); },
  };
  return { scene: { add }, objects };
}

test('button uses a native Phaser Rectangle matching its visible bounds, without a Zone or custom hit area', async () => {
  const source = await readFile(new URL('../src/ui/gameButton.js', import.meta.url), 'utf8');
  const fixture = buttonScene();
  const button = createGameButton(fixture.scene, {
    x: 24, y: 48, label: 'TEST', width: 190, height: 68, fontSize: 20, onPress() {},
  });

  assert.equal(button.inputTarget.type, 'Rectangle');
  assert.deepEqual(
    { x: button.inputTarget.x, y: button.inputTarget.y, width: button.inputTarget.width, height: button.inputTarget.height },
    { x: 24, y: 48, width: 190, height: 68 },
  );
  assert.match(source, /scene\.add\.rectangle\(x, y, width, height/);
  assert.doesNotMatch(source, /scene\.add\.zone|new Phaser\.Geom\.Rectangle/);
});

test('enabled button calls its callback on every pointerdown', () => {
  const fixture = buttonScene();
  let presses = 0;
  const button = createGameButton(fixture.scene, {
    x: 0, y: 0, label: 'TEST', width: 100, height: 40, fontSize: 20,
    onPress: () => { presses += 1; },
  });

  button.inputTarget.emit('pointerdown');
  button.inputTarget.emit('pointerdown');

  assert.equal(presses, 2);
});

test('disabled button does not call its callback', () => {
  const fixture = buttonScene();
  let presses = 0;
  const button = createGameButton(fixture.scene, {
    x: 0, y: 0, label: 'TEST', width: 100, height: 40, fontSize: 20,
    onPress: () => { presses += 1; },
  });

  button.disable();
  button.inputTarget.emit('pointerdown');

  assert.equal(presses, 0);
  assert.equal(button.visual.scale, 1);
});

test('button can start disabled and become interactive through native Phaser input', () => {
  const fixture = buttonScene();
  let presses = 0;
  const button = createGameButton(fixture.scene, {
    x: 0, y: 0, label: 'TEST', width: 100, height: 40, fontSize: 20,
    onPress: () => { presses += 1; }, interactive: false,
  });

  button.inputTarget.emit('pointerdown');
  assert.equal(presses, 0);
  button.enable();
  button.inputTarget.emit('pointerdown');
  assert.equal(presses, 1);
});
