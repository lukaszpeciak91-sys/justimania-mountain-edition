import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  consumeVictoryReplay,
  hideVictoryModal,
  showVictoryModal,
  VICTORY_REPLAY_KEY,
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
  const title = { textContent: '' };
  const subtitle = { textContent: '' };
  const time = { textContent: '' };
  const replay = makeButton();
  const menu = makeButton();
  const values = new Map();
  let reloads = 0;
  globalThis.document = { getElementById: (id) => ({
    'victory-modal': modal,
    'victory-title': title,
    'victory-subtitle': subtitle,
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
  return { modal, title, subtitle, time, replay, menu, values, reloads: () => reloads };
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
  assert.equal(dom.values.has(VICTORY_REPLAY_KEY), false);
});

test('Victory copy is edition-specific and Beach contains no elevation', () => {
  const mountain = installDom();
  showVictoryModal('07:20', 'mountain');
  assert.deepEqual([mountain.title.textContent, mountain.subtitle.textContent], ['SUMMIT REACHED!', 'RYSY • 2499 m']);
  const beach = installDom();
  showVictoryModal('07:20', 'beach');
  assert.deepEqual([beach.title.textContent, beach.subtitle.textContent], ['COAST COMPLETED!', 'ŚWINOUJŚCIE']);
  assert.doesNotMatch(`${beach.title.textContent} ${beach.subtitle.textContent}`, /\d|\bm\b|km/i);
});

test('Victory destination names opt out of browser translation without blocking the page', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<div id="victory-subtitle" class="victory-subtitle" translate="no">/);
  assert.doesNotMatch(html, /<(?:html|body)[^>]*translate="no"|notranslate/);
});

for (const editionId of ['mountain', 'beach']) test(`PLAY AGAIN preserves ${editionId} in a session one-shot`, () => {
  const dom = installDom();
  showVictoryModal('01:23', editionId);
  dom.replay.click();
  dom.replay.click();
  assert.equal(dom.reloads(), 1);
  assert.deepEqual(JSON.parse(dom.values.get(VICTORY_REPLAY_KEY)), { autostart: true, editionId });
  assert.deepEqual(consumeVictoryReplay(), { autostart: true, editionId });
  assert.equal(consumeVictoryReplay(), null);
  hideVictoryModal();
  assert.equal(dom.modal.hidden, true);
  assert.equal(dom.replay.listeners.size, 0);
});

test('normal refresh has no autostart and BootScene selects EditionSelectScene', () => {
  installDom();
  assert.equal(consumeVictoryReplay(), null);
  const boot = readFileSync(new URL('../src/scenes/BootScene.js', import.meta.url), 'utf8');
  assert.match(boot, /this\.scene\.start\('EditionSelectScene'\)/);
});
