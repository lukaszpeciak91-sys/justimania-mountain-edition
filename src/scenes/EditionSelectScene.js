import Phaser from 'phaser';
import { createGameButton } from '../ui/gameButton.js';
import { EDITION_IDS, EDITIONS } from '../config/editions.js';
import { selectEdition } from '../config/editionState.js';

export default class EditionSelectScene extends Phaser.Scene {
  constructor() { super('EditionSelectScene'); }

  create() {
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
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.editionButtons.forEach((button) => button.destroy()));
  }

  chooseEdition(id) {
    const edition = selectEdition(this.registry, id);
    this.editionButtons.forEach((button) => button.disable());
    this.scene.start('MenuScene', { editionId: edition.id });
  }
}
