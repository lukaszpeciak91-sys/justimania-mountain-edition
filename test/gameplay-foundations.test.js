import test from 'node:test';
import assert from 'node:assert/strict';
import AscentTracker from '../src/gameplay/AscentTracker.js';
import { PLATFORM_GENERATION } from '../src/gameplay/difficulty.js';

test('ascent only increases at a new highest position', () => {
  const ascent = new AscentTracker(720);
  assert.equal(ascent.update(700), 20);
  assert.equal(ascent.update(715), 20);
  assert.equal(ascent.update(640.2), 79);
});

test('generation limits remain conservative for the portrait world', () => {
  assert.ok(PLATFORM_GENERATION.verticalGapMin >= 100);
  assert.ok(PLATFORM_GENERATION.verticalGapMax >= 128);
  assert.ok(PLATFORM_GENERATION.verticalGapMax <= 132);
  assert.ok(PLATFORM_GENERATION.horizontalStepMax >= 120);
  assert.ok(PLATFORM_GENERATION.horizontalStepMax <= 125);
  assert.ok(PLATFORM_GENERATION.widthMin >= 100);
  assert.ok(PLATFORM_GENERATION.widthMax < 390 - PLATFORM_GENERATION.worldMargin * 2);
});
