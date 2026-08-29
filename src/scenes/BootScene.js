import Phaser from 'phaser';
import {
  assetsForEdition,
  BOOT_ASSETS,
  enqueueMissingAssets,
  ensureAssetsLoaded,
  reportAssetStatus,
} from '../assets.js';
import { consumeVictoryReplay } from '../ui/victoryModal.js';
import { selectEdition } from '../config/editionState.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  preload() {
    // Kept as an explicit contract even though the source-generated selector
    // currently requires no binary bootstrap assets.
    enqueueMissingAssets(this, BOOT_ASSETS);
  }

  async create() {
    const replay = consumeVictoryReplay();
    if (replay) {
      selectEdition(this.registry, replay.editionId);
      await ensureAssetsLoaded(this, assetsForEdition(replay.editionId));
      reportAssetStatus(this);
      this.scene.start('GameScene', { editionId: replay.editionId });
      return;
    }
    this.scene.start('EditionSelectScene');
  }
}
