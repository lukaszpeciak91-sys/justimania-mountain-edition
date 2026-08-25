import Phaser from 'phaser';
import { ASSETS, textureAvailable } from '../assets.js';

const MENU_DRIFT = { x: 9, y: 6, duration: 9000 };

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#173c36');
    if (textureAvailable(this, ASSETS.menuBackground)) {
      const source = this.textures.get(ASSETS.menuBackground.key).getSourceImage();
      const scale = Math.max((width + MENU_DRIFT.x * 2) / source.width, (height + MENU_DRIFT.y * 2) / source.height);
      const background = this.add.image(width / 2, height / 2, ASSETS.menuBackground.key).setScale(scale);
      this.tweens.add({
        targets: background,
        x: width / 2 + MENU_DRIFT.x,
        y: height / 2 + MENU_DRIFT.y,
        duration: MENU_DRIFT.duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, 0x173c36);
    }
    this.add.text(width / 2, height * 0.3, 'JUSTIMANIA', { fontFamily: 'system-ui', fontSize: '46px', fontStyle: 'bold', color: '#fff4bf' }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.38, 'MOUNTAIN EDITION', { fontFamily: 'system-ui', fontSize: '20px', letterSpacing: 3, color: '#d4eee5' }).setOrigin(0.5);
    const button = this.add.rectangle(width / 2, height * 0.62, 190, 68, 0xf3b942).setStrokeStyle(4, 0xffe6a3).setInteractive({ useHandCursor: true });
    this.add.text(button.x, button.y, 'START', { fontFamily: 'system-ui', fontSize: '30px', fontStyle: 'bold', color: '#173c36' }).setOrigin(0.5);
    button.on('pointerdown', () => this.scene.start('GameScene'));
  }
}
