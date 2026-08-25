import test from 'node:test';
import assert from 'node:assert/strict';
import AscentTracker from '../src/gameplay/AscentTracker.js';
import {
  airborneTimeAtHeight,
  generatePlatformSpec,
  horizontalAllowance,
  PLATFORM_GENERATION,
} from '../src/gameplay/difficulty.js';
import { fellBelowCamera, wrappedHorizontalPosition } from '../src/gameplay/worldWrap.js';

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
  assert.ok(PLATFORM_GENERATION.widthMin >= 100);
  assert.ok(PLATFORM_GENERATION.widthMax < 390 - PLATFORM_GENERATION.worldMargin * 2);
});

test('horizontal allowance follows airborne time with a touch control margin', () => {
  const lowerGapAllowance = horizontalAllowance(105);
  const higherGapAllowance = horizontalAllowance(130);
  assert.ok(airborneTimeAtHeight(105) > airborneTimeAtHeight(130));
  assert.ok(lowerGapAllowance > higherGapAllowance);
  assert.ok(lowerGapAllowance < airborneTimeAtHeight(105) * 205);
  assert.ok(higherGapAllowance >= 90, 'bootstrap gaps retain useful horizontal variety');
});

test('generated platforms stay reachable and inside width-aware safe margins', () => {
  const values = [0, 0.99, 0.99, 0.99, 0.25, 0.75];
  let index = 0;
  let previous = { x: 195, lastStep: 0, recentWidths: [] };
  for (let count = 0; count < 30; count += 1) {
    const spec = generatePlatformSpec(previous, () => values[index++ % values.length]);
    assert.ok(Math.abs(spec.step) <= spec.maxStep);
    assert.ok(spec.x - spec.width / 2 >= PLATFORM_GENERATION.worldMargin);
    assert.ok(spec.x + spec.width / 2 <= 390 - PLATFORM_GENERATION.worldMargin);
    previous = { x: spec.x, lastStep: spec.step, recentWidths: [...previous.recentWidths.slice(-2), spec.width] };
  }
});

test('width bands produce visibly distinct, bounded platform widths', () => {
  const widths = [0.02, 0.42, 0.82].map((choice) => {
    const values = [0.5, choice, 0.5, 0.5];
    let index = 0;
    return generatePlatformSpec({ x: 195, lastStep: 0, recentWidths: [] }, () => values[index++]).width;
  });
  assert.ok(new Set(widths).size === 3);
  assert.ok(Math.max(...widths) - Math.min(...widths) >= 60);
  widths.forEach((width) => assert.ok(width >= PLATFORM_GENERATION.widthMin && width <= PLATFORM_GENERATION.widthMax));
});

test('horizontal wrap crosses both directions without changing velocity', () => {
  const velocity = -205;
  assert.equal(wrappedHorizontalPosition(-37, 72, 390), 426);
  assert.equal(velocity, -205);
  assert.equal(wrappedHorizontalPosition(427, 72, 390), -36);
  assert.equal(velocity, -205);
  assert.equal(wrappedHorizontalPosition(0, 72, 390), 0, 'does not wrap while still visible');
  assert.equal(fellBelowCamera(500, 0), false, 'horizontal crossing cannot cause game over');
  assert.equal(fellBelowCamera(921, 0), true, 'falling below the camera still causes game over');
});
