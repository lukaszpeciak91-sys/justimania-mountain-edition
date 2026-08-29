import assert from 'node:assert/strict';
import test from 'node:test';
import { hideMenuControls, showMenuControls } from '../src/ui/menuControls.js';

function installDom() {
  const resizeListeners = new Set();
  const makeButton = () => ({
    listeners: new Set(), style: {},
    addEventListener(type, listener) { if (type === 'click') this.listeners.add(listener); },
    removeEventListener(type, listener) { if (type === 'click') this.listeners.delete(listener); },
    click() { [...this.listeners].forEach((listener) => listener()); },
  });
  const container = { hidden: true };
  const start = makeButton();
  const back = makeButton();
  const canvas = { getBoundingClientRect: () => ({ left: 10, top: 20, width: 195, height: 422 }) };
  globalThis.document = {
    getElementById(id) { return { 'menu-controls': container, 'menu-start-button': start, 'menu-back-button': back }[id] ?? null; },
    querySelector: () => canvas,
  };
  globalThis.window = {
    addEventListener(type, listener) { if (type === 'resize') resizeListeners.add(listener); },
    removeEventListener(type, listener) { if (type === 'resize') resizeListeners.delete(listener); },
  };
  return { container, start, back, resizeListeners };
}

test('menu controls show together, align to the canvas, and activate only once', () => {
  const dom = installDom();
  let starts = 0;
  let backs = 0;
  showMenuControls(() => { starts += 1; }, () => { backs += 1; });
  assert.equal(dom.container.hidden, false);
  assert.equal(dom.start.style.width, '95px');
  assert.equal(dom.start.style.left, '107.5px');
  assert.equal(dom.back.style.top, '270px');
  dom.start.click();
  dom.back.click();
  assert.deepEqual({ starts, backs }, { starts: 1, backs: 0 });
});

test('cleanup hides controls and removes click and resize listeners', () => {
  const dom = installDom();
  showMenuControls(() => {}, () => {});
  hideMenuControls();
  assert.equal(dom.container.hidden, true);
  assert.equal(dom.start.listeners.size, 0);
  assert.equal(dom.back.listeners.size, 0);
  assert.equal(dom.resizeListeners.size, 0);
  delete globalThis.document;
  delete globalThis.window;
});
