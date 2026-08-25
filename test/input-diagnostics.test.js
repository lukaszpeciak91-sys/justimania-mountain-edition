import assert from 'node:assert/strict';
import test from 'node:test';
import { createInputDiagnostics, inputDebugEnabled } from '../src/debug/inputDiagnostics.js';

test('input debug mode is disabled without its query flag', () => {
  assert.equal(inputDebugEnabled(''), false);
  assert.equal(inputDebugEnabled('?something=else'), false);
});

test('input debug mode is enabled only by inputdebug=1', () => {
  assert.equal(inputDebugEnabled('?inputdebug=1'), true);
  assert.equal(inputDebugEnabled('?inputdebug=0'), false);
});

test('input diagnostic history is bounded', () => {
  const diagnostics = createInputDiagnostics({ enabled: true, maxEvents: 3 });
  ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((stage) => diagnostics.record(stage));
  assert.deepEqual(diagnostics.history(), ['TWO', 'THREE', 'FOUR']);
});

test('disabled diagnostics retain no gameplay-adjacent state', () => {
  const diagnostics = createInputDiagnostics({ enabled: false });
  diagnostics.record('IGNORED');
  assert.deepEqual(diagnostics.history(), []);
});
