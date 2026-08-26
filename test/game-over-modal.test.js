import test from 'node:test';
import assert from 'node:assert/strict';
import { hideGameOverModal, showGameOverModal } from '../src/ui/gameOverModal.js';

function installDom() {
  const listeners = new Set();
  const modal = { hidden: true };
  const button = {
    addEventListener(type, listener) { if (type === 'click') listeners.add(listener); },
    removeEventListener(type, listener) { if (type === 'click') listeners.delete(listener); },
    click() { [...listeners].forEach((listener) => listener()); },
  };
  globalThis.document = {
    getElementById(id) {
      return id === 'game-over-modal' ? modal : id === 'game-over-menu-button' ? button : null;
    },
  };
  return { modal, button, listeners };
}

test('native MENU ignores duplicate clicks and does not duplicate listeners', () => {
  const { modal, button, listeners } = installDom();
  let firstCalls = 0;
  let secondCalls = 0;
  showGameOverModal(() => { firstCalls += 1; });
  assert.equal(modal.hidden, false);
  assert.equal(listeners.size, 1);

  showGameOverModal(() => { secondCalls += 1; });
  assert.equal(listeners.size, 1);
  button.click();
  button.click();
  assert.equal(firstCalls, 0);
  assert.equal(secondCalls, 1);
});

test('modal hide cleanup is idempotent and supports repeated cycles', () => {
  const { modal, button, listeners } = installDom();
  let calls = 0;
  for (let cycle = 0; cycle < 2; cycle += 1) {
    showGameOverModal(() => { calls += 1; });
    button.click();
    hideGameOverModal();
    hideGameOverModal();
    assert.equal(modal.hidden, true);
    assert.equal(listeners.size, 0);
  }
  assert.equal(calls, 2);
  delete globalThis.document;
});
