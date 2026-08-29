import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { formatRunTime } from '../src/gameplay/runTime.js';

test('run time formatter produces compact MM:SS values', () => {
  assert.equal(formatRunTime(0), '00:00');
  assert.equal(formatRunTime(59_000), '00:59');
  assert.equal(formatRunTime(60_000), '01:00');
  assert.equal(formatRunTime(754_000), '12:34');
});

test('GameScene renders edition-specific HEIGHT or PROGRESS with shared TIME placement', async () => {
  const source = await readFile(new URL('../src/scenes/GameScene.js', import.meta.url), 'utf8');
  assert.match(source, /runStartedAt = this\.time\.now;[\s\S]*runElapsedMs = 0;/);
  assert.match(source, /`PROGRESS \$\{Math\.min\(100,[^`]+%`/);
  assert.match(source, /`HEIGHT \$\{normalizedHeight\(ascent\)\} m`/);
  assert.match(source, /return `\$\{metric\}  •  TIME \$\{formatRunTime\(elapsedMs\)\}`/);
  assert.match(source, /\.setOrigin\(0\.5\)\.setScrollFactor\(0\)\.setDepth\(20\)/);
  assert.equal(source.match(/this\.hudText = this\.add\.text/g)?.length, 1);
});

test('run timer freezes when Game Over or Victory begins', async () => {
  const source = await readFile(new URL('../src/scenes/GameScene.js', import.meta.url), 'utf8');
  const summit = source.match(/reachSummit\(platform\) \{([\s\S]*?)\n  \}/)?.[1] ?? '';
  const gameOver = source.match(/showGameOver\(\) \{([\s\S]*?)\n  \}/)?.[1] ?? '';
  assert.match(summit, /enterVictory[\s\S]*freezeRunTimer\(\)/);
  assert.match(gameOver, /enterGameOver[\s\S]*freezeRunTimer\(\)/);
  assert.match(source, /if \(!gameplayIsActive\(this\.runState\)\) \{\s*return;/);
});

test('HUD timer uses scene time without an interval', async () => {
  const source = await readFile(new URL('../src/scenes/GameScene.js', import.meta.url), 'utf8');
  assert.match(source, /now - this\.runStartedAt/);
  assert.doesNotMatch(source, /setInterval/);
});
