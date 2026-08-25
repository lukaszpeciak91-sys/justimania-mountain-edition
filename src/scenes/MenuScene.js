import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#173c36');
    this.add.text(width / 2, height * 0.3, 'JUSTIMANIA', { fontFamily: 'system-ui', fontSize: '46px', fontStyle: 'bold', color: '#fff4bf' }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.38, 'MOUNTAIN EDITION', { fontFamily: 'system-ui', fontSize: '20px', letterSpacing: 3, color: '#d4eee5' }).setOrigin(0.5);
    const button = this.add.rectangle(width / 2, height * 0.62, 190, 68, 0xf3b942).setStrokeStyle(4, 0xffe6a3).setInteractive({ useHandCursor: true });
    this.add.text(button.x, button.y, 'START', { fontFamily: 'system-ui', fontSize: '30px', fontStyle: 'bold', color: '#173c36' }).setOrigin(0.5);
    button.on('pointerdown', () => this.scene.start('GameScene'));
  }
}
