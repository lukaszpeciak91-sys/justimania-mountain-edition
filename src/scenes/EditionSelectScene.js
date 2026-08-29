import Phaser from 'phaser';
import { createGameButton } from '../ui/gameButton.js';
import { EDITION_IDS, EDITIONS } from '../config/editions.js';
import { selectEdition } from '../config/editionState.js';
import { assetsForEdition, ensureAssetsLoaded, reportAssetStatus } from '../assets.js';

export default class EditionSelectScene extends Phaser.Scene {
  constructor() { super('EditionSelectScene'); }

  create() {
    this.loading = false;
    this.loadingText?.setText('');
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0b0d0d');
    this.add.text(width / 2, height * 0.25, 'JUSTIMANIA', {
      fontFamily: 'Bungee, "Arial Black", sans-serif', fontSize: '42px', color: '#fff1d0',
    }).setOrigin(0.5);
    this.editionButtons = EDITION_IDS.map((id, index) => createGameButton(this, {
      x: width / 2,
      y: height * (0.47 + index * 0.15),
      label: EDITIONS[id].label,
      width: 300,
      height: 76,
      fontSize: 25,
      onPress: () => this.chooseEdition(id),
    }));
    this.loadingText = this.add.text(width / 2, height * 0.76, '', {
      fontFamily: 'Bungee, "Arial Black", sans-serif', fontSize: '22px', color: '#fff1d0',
    }).setOrigin(0.5);
    this.loadingText.setText('');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.editionButtons.forEach((button) => button.destroy()));
  }

  async chooseEdition(id) {
    if (this.loading) return;
    this.loading = true;
    const edition = selectEdition(this.registry, id);
    this.editionButtons.forEach((button) => button.disable());
    this.loadingText.setText('LOADING...');
    await ensureAssetsLoaded(this, assetsForEdition(edition.id));
    reportAssetStatus(this);
    this.scene.start('MenuScene', { editionId: edition.id });
  }
}
