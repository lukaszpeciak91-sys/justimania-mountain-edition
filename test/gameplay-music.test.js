import test from 'node:test';
import assert from 'node:assert/strict';
import GameplayMusic, { GAME_MUSIC_VOLUME } from '../src/gameplay/GameplayMusic.js';

function createHarness({ available = true, playResults = [true] } = {}) {
  const listeners = new Map();
  const inputListeners = new Map();
  const music = {
    isPlaying: false,
    playCalls: 0,
    stopCalls: 0,
    destroyCalls: 0,
    play() {
      const result = playResults[Math.min(this.playCalls, playResults.length - 1)];
      this.playCalls += 1;
      this.isPlaying = result;
      return result;
    },
    stop() { this.stopCalls += 1; this.isPlaying = false; },
    destroy() { this.destroyCalls += 1; },
  };
  const soundManager = {
    additions: [],
    add(key, config) { this.additions.push({ key, config }); return music; },
    once(event, listener) { listeners.set(event, listener); },
    off(event, listener) { if (listeners.get(event) === listener) listeners.delete(event); },
  };
  const input = {
    once(event, listener) { inputListeners.set(event, listener); },
    off(event, listener) { if (inputListeners.get(event) === listener) inputListeners.delete(event); },
  };
  return {
    owner: new GameplayMusic({ soundManager, input, key: 'game-theme', available }),
    soundManager,
    music,
    listeners,
    inputListeners,
  };
}

test('gameplay music owns only one looping sound at the centralized volume', () => {
  const harness = createHarness();
  assert.equal(harness.owner.start(), true);
  assert.equal(harness.owner.start(), false);
  assert.deepEqual(harness.soundManager.additions, [{
    key: 'game-theme',
    config: { loop: true, volume: GAME_MUSIC_VOLUME },
  }]);
  assert.equal(harness.music.playCalls, 1);
});

test('blocked playback retries on the next interaction without creating another sound', () => {
  const harness = createHarness({ playResults: [false, true] });
  assert.equal(harness.owner.start(), false);
  assert.equal(harness.inputListeners.has('pointerdown'), true);
  harness.inputListeners.get('pointerdown')();
  assert.equal(harness.music.playCalls, 2);
  assert.equal(harness.soundManager.additions.length, 1);
});

test('shutdown stops and destroys the owned sound and removes pending listeners', () => {
  const harness = createHarness({ playResults: [false] });
  harness.owner.start();
  harness.owner.destroy();
  assert.equal(harness.music.stopCalls, 1);
  assert.equal(harness.music.destroyCalls, 1);
  assert.equal(harness.owner.music, null);
  assert.equal(harness.listeners.size, 0);
  assert.equal(harness.inputListeners.size, 0);
});

test('a missing audio asset is tolerated without creating a sound', () => {
  const harness = createHarness({ available: false });
  assert.equal(harness.owner.start(), false);
  assert.equal(harness.soundManager.additions.length, 0);
  harness.owner.destroy();
});

test('music can become available after gameplay starts without duplicating its loop', () => {
  const harness = createHarness({ available: false });
  assert.equal(harness.owner.start(), false);
  assert.equal(harness.owner.makeAvailable(), true);
  assert.equal(harness.owner.makeAvailable(), false);
  assert.equal(harness.soundManager.additions.length, 1);
});
