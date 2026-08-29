import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const gameScene = readFileSync(new URL('../src/scenes/GameScene.js', import.meta.url), 'utf8');
const touchControls = gameScene.match(/  createTouchZones\(\) \{[\s\S]*?\n  \}\n\n  update\(\)/)?.[0];

test('touch arrows use edition-specific color without changing their presentation', () => {
  assert.ok(touchControls);
  assert.match(touchControls,
    /this\.edition\.id === 'mountain' \? '#fff1d099' : '#173c3677'/);
  assert.match(touchControls,
    /this\.add\.text\(x, 770, label, \{ fontSize: '54px', color: arrowColor \}\)/);
  assert.match(touchControls, /makeZone\(97\.5, -1, '◀'\); makeZone\(292\.5, 1, '▶'\);/);
});

test('touch-zone geometry and pointer behavior remain fixed', () => {
  assert.ok(touchControls);
  assert.match(touchControls,
    /this\.add\.zone\(x, 724, 195, 240\)\.setScrollFactor\(0\)\.setInteractive\(\)/);
  assert.match(touchControls,
    /zone\.on\('pointerdown', \(\) => \{\n        if \(gameplayIsActive\(this\.runState\)\) this\.touchDirection = direction;\n      \}\);/);
  assert.match(touchControls,
    /zone\.on\('pointerup', \(\) => \{ if \(this\.touchDirection === direction\) this\.touchDirection = 0; \}\);/);
  assert.match(touchControls,
    /zone\.on\('pointerout', \(pointer\) => \{ if \(!pointer\.isDown && this\.touchDirection === direction\) this\.touchDirection = 0; \}\);/);
});
