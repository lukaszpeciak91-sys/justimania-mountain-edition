import Phaser from 'phaser';
import { BOOT_ASSETS, reportAssetStatus } from '../assets.js';
import { consumeVictoryReplay } from '../ui/victoryModal.js';
import { selectEdition } from '../config/editionState.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  preload() {
    BOOT_ASSETS.forEach((asset) => {
      if (asset.type === 'spritesheet') {
        this.load.spritesheet(asset.key, asset.path, { frameWidth: 768, frameHeight: 768 });
      } else {
        this.load.image(asset.key, asset.path);
      }
    });
    this.load.on('loaderror', (file) => {
      if (import.meta.env.DEV) console.warn(`[assets] Failed to load ${file.src}; fallback will be used.`);
    });
  }

  create() {
    reportAssetStatus(this);
    const replay = consumeVictoryReplay();
    if (replay) {
      selectEdition(this.registry, replay.editionId);
      this.scene.start('GameScene', { editionId: replay.editionId });
      return;
    }
    this.scene.start('EditionSelectScene');
  }
}
