import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

class EditionSelectSceneHarness {
  constructor() {
    this.navigation = [];
    this.loadingText = { value: 'stale', setText: (value) => { this.loadingText.value = value; } };
  }

  create() {
    this.loading = false;
    this.loadingText.setText('');
  }

  async chooseEdition(id) {
    if (this.loading) return;
    this.loading = true;
    await Promise.resolve();
    this.navigation.push(id);
  }
}

test('Mountain then BACK re-entry allows Beach navigation', async () => {
  const scene = new EditionSelectSceneHarness();
  scene.create();
  await scene.chooseEdition('mountain');
  scene.create();
  assert.equal(scene.loading, false);
  assert.equal(scene.loadingText.value, '');
  await scene.chooseEdition('beach');
  assert.deepEqual(scene.navigation, ['mountain', 'beach']);
});

test('Beach then BACK re-entry allows Mountain navigation', async () => {
  const scene = new EditionSelectSceneHarness();
  scene.create();
  await scene.chooseEdition('beach');
  scene.create();
  await scene.chooseEdition('mountain');
  assert.deepEqual(scene.navigation, ['beach', 'mountain']);
});

test('every selector create resets loading through repeated entries', async () => {
  const scene = new EditionSelectSceneHarness();
  const editions = ['mountain', 'beach', 'mountain', 'beach', 'mountain'];
  for (const edition of editions) {
    scene.create();
    assert.equal(scene.loading, false);
    await scene.chooseEdition(edition);
    assert.equal(scene.loading, true);
  }
  assert.deepEqual(scene.navigation, editions);
});

test('the production selector resets before creating interactive buttons and retains its double-tap guard', async () => {
  const source = await readFile(new URL('../src/scenes/EditionSelectScene.js', import.meta.url), 'utf8');
  const resetIndex = source.indexOf('this.loading = false');
  const buttonsIndex = source.indexOf('this.editionButtons =');
  assert.ok(resetIndex >= 0 && resetIndex < buttonsIndex);
  assert.match(source, /this\.loadingText\.setText\(''\)/);
  assert.match(source, /if \(this\.loading\) return;\s*this\.loading = true/);
  assert.match(source, /await ensureAssetsLoaded\(this, assetsForEdition\(edition\.id\)\)/);
});
