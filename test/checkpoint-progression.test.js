import test from 'node:test';
import assert from 'node:assert/strict';
import { CHECKPOINT_DECORATION_SPEC, FINAL_SUMMIT, MOUNTAIN_CHECKPOINTS } from '../src/gameplay/checkpointData.js';
import { normalizedHeight } from '../src/gameplay/heightNormalization.js';
import { CheckpointProgress } from '../src/gameplay/CheckpointManager.js';
import { createRunState, enterVictory, gameplayIsActive, requestVictoryAction } from '../src/gameplay/runState.js';

test('canonical mountain table is ordered, unique, and ends at Rysy', () => {
  assert.equal(MOUNTAIN_CHECKPOINTS.length, 12);
  assert.equal(new Set(MOUNTAIN_CHECKPOINTS.map(({ id }) => id)).size, 12);
  MOUNTAIN_CHECKPOINTS.slice(1).forEach((item, index) => assert.ok(item.ascentThreshold > MOUNTAIN_CHECKPOINTS[index].ascentThreshold));
  assert.deepEqual(FINAL_SUMMIT, MOUNTAIN_CHECKPOINTS.at(-1));
  assert.equal(FINAL_SUMMIT.name, 'Rysy');
  assert.equal(FINAL_SUMMIT.elevationMeters, 2499);
  assert.equal(FINAL_SUMMIT.finalSummit, true);
  assert.equal(normalizedHeight(FINAL_SUMMIT.ascentThreshold), 2499);
});

test('height normalization clamps and deterministically follows maximum ascent', () => {
  assert.equal(normalizedHeight(-50), 0);
  assert.equal(normalizedHeight(0), 0);
  assert.equal(normalizedHeight(450), 491);
  assert.equal(normalizedHeight(450), 491);
  assert.equal(normalizedHeight(FINAL_SUMMIT.ascentThreshold), 2499);
  assert.equal(normalizedHeight(FINAL_SUMMIT.ascentThreshold + 999), 2499);
  const values = [0, 100, 80, 1800, 1700, 9000].map((value, index, source) => normalizedHeight(Math.max(...source.slice(0, index + 1))));
  assert.deepEqual(values, [...values].sort((a, b) => a - b));
});

test('checkpoint state spawns and reaches each milestone exactly once in order', () => {
  const progress = new CheckpointProgress();
  MOUNTAIN_CHECKPOINTS.forEach((checkpoint) => {
    const platform = { y: 790 - checkpoint.ascentThreshold };
    assert.equal(progress.claimRoute(platform), checkpoint);
    assert.equal(progress.claimRoute(platform), null);
    assert.equal(progress.state(checkpoint.id), 'spawned');
    assert.equal(progress.reach(checkpoint.id), checkpoint);
    assert.equal(progress.reach(checkpoint.id), null);
  });
  const fresh = new CheckpointProgress();
  assert.ok(MOUNTAIN_CHECKPOINTS.every(({ id }) => fresh.state(id) === 'pending'));
});

test('checkpoint progression rejects out-of-order reaches', () => {
  const progress = new CheckpointProgress();
  progress.claimRoute({ y: -200 });
  progress.claimRoute({ y: -1200 });
  assert.equal(progress.reach('wysoka'), null);
  assert.equal(progress.reach('trzy-korony')?.id, 'trzy-korony');
  assert.equal(progress.reach('wysoka')?.id, 'wysoka');
});

test('decoration spec is visual-only with dynamic sign and Kaya sheet metadata', () => {
  assert.equal(CHECKPOINT_DECORATION_SPEC.collision, false);
  assert.equal(CHECKPOINT_DECORATION_SPEC.sign.dynamicText, true);
  assert.equal(CHECKPOINT_DECORATION_SPEC.kaya.columns, 3);
  assert.deepEqual(CHECKPOINT_DECORATION_SPEC.kaya.sequence, [0, 1, 2, 1]);
  assert.equal(CHECKPOINT_DECORATION_SPEC.kaya.frameRate, 7);
});

test('only a final summit landing enters victory and navigation is guarded', () => {
  const state = createRunState();
  assert.equal(enterVictory(state, false), false);
  assert.equal(gameplayIsActive(state), true);
  assert.equal(enterVictory(state, true), true);
  assert.equal(enterVictory(state, true), false);
  assert.equal(gameplayIsActive(state), false);
  assert.equal(requestVictoryAction(state, 'restart'), true);
  assert.equal(requestVictoryAction(state, 'restart'), false);
  assert.equal(requestVictoryAction(state, 'menu'), false);
  const menuState = createRunState();
  enterVictory(menuState, true);
  assert.equal(requestVictoryAction(menuState, 'menu'), true);
});
