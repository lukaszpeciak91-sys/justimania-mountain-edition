import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  consumeVictoryAutostart,
  hideVictoryModal,
  showVictoryModal,
  VICTORY_AUTOSTART_KEY,
} from '../src/ui/victoryModal.js';

function installDom() {
  const makeButton = () => {
    const listeners = new Set();
    return {
      listeners,
      addEventListener(type, listener) { if (type === 'click') listeners.add(listener); },
      removeEventListener(type, listener) { if (type === 'click') listeners.delete(listener); },
      click() { [...listeners].forEach((listener) => listener()); },
    };
  };
  const modal = { hidden: true };
  const time = { textContent: '' };
  const replay = makeButton();
  const menu = makeButton();
  const values = new Map();
  let reloads = 0;
  globalThis.document = { getElementById: (id) => ({
    'victory-modal': modal,
    'victory-time': time,
    'victory-play-again-button': replay,
    'victory-menu-button': menu,
  }[id] ?? null) };
  globalThis.sessionStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  globalThis.window = { location: { reload: () => { reloads += 1; } } };
  return { modal, time, replay, menu, values, reloads: () => reloads };
}

test('Victory native MENU reloads once without setting autostart', () => {
  const dom = installDom();
  showVictoryModal('07:20');
  assert.equal(dom.modal.hidden, false);
  assert.equal(dom.time.textContent, 'TIME 07:20');
  dom.menu.click();
  dom.menu.click();
  dom.replay.click();
  assert.equal(dom.reloads(), 1);
  assert.equal(dom.values.has(VICTORY_AUTOSTART_KEY), false);
});

test('PLAY AGAIN stores a session one-shot, reloads once, and consumption clears it', () => {
  const dom = installDom();
  showVictoryModal('01:23');
  dom.replay.click();
  dom.replay.click();
  assert.equal(dom.reloads(), 1);
  assert.equal(dom.values.get(VICTORY_AUTOSTART_KEY), '1');
  assert.equal(consumeVictoryAutostart(), true);
  assert.equal(consumeVictoryAutostart(), false);
  hideVictoryModal();
  assert.equal(dom.modal.hidden, true);
  assert.equal(dom.replay.listeners.size, 0);
});

test('normal boot has no autostart and BootScene selects MenuScene', () => {
  installDom();
  assert.equal(consumeVictoryAutostart(), false);
  const boot = readFileSync(new URL('../src/scenes/BootScene.js', import.meta.url), 'utf8');
  assert.match(boot, /consumeVictoryAutostart\(\) \? 'GameScene' : 'MenuScene'/);
});

