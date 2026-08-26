import Phaser from 'phaser';
import { createGameButton } from '../ui/gameButton.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const { width, height } = this.scale;
    this.navigating = false;
    this.input.enabled = true;
    this.cameras.main.setScroll(0, 0);

    this.add.rectangle(width / 2, height / 2, width, height, 0x102d2a, 0.55);
    this.add.rectangle(width / 2, height / 2, 330, 220, 0x102d2a, 0.92);
    this.add.text(width / 2, height / 2 - 62, 'RUN OVER', {
      fontSize: '35px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.menuButton = createGameButton(this, {
      x: width / 2,
      y: height / 2 + 34,
      label: 'MENU',
      width: 220,
      height: 60,
      fontSize: 25,
      onPress: () => this.returnToMenu(),
    });
  }

  returnToMenu() {
    if (this.navigating) return;
    this.navigating = true;
    this.menuButton.disable();
    this.scene.stop('GameOverScene');
    this.scene.stop('GameScene');
    this.scene.start('MenuScene');
  }
}
