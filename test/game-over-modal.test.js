import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hideGameOverModal, showGameOverModal } from '../src/ui/gameOverModal.js';

test('index uses the canonical GAME OVER loss title', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<div id="game-over-title" class="game-over-title">GAME OVER<\/div>/);
});

function installDom() {
  const listeners = new Set();
  const modal = { hidden: true };
  let reloadCalls = 0;
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
  globalThis.window = { location: { reload() { reloadCalls += 1; } } };
  return { modal, button, listeners, reloadCalls: () => reloadCalls };
}

test('native MENU reloads the current page once and ignores duplicate clicks', () => {
  const { modal, button, listeners, reloadCalls } = installDom();
  showGameOverModal();
  assert.equal(modal.hidden, false);
  assert.equal(listeners.size, 1);

  showGameOverModal();
  assert.equal(listeners.size, 1);
  button.click();
  button.click();
  assert.equal(reloadCalls(), 1);
});

test('modal hide cleanup is idempotent and supports repeated cycles', () => {
  const { modal, button, listeners } = installDom();
  for (let cycle = 0; cycle < 2; cycle += 1) {
    showGameOverModal();
    hideGameOverModal();
    hideGameOverModal();
    assert.equal(modal.hidden, true);
    assert.equal(listeners.size, 0);
  }
  delete globalThis.document;
  delete globalThis.window;
});
