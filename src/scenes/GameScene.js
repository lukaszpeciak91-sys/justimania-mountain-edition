import Phaser from 'phaser';
import Player from '../gameplay/Player.js';
import PlatformManager from '../gameplay/PlatformManager.js';
import BackgroundManager from '../gameplay/BackgroundManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    new BackgroundManager(this).create();
    this.platforms = new PlatformManager(this);
    this.platforms.createBootstrapCourse();
    this.player = new Player(this, 195, 720);
    this.physics.add.collider(this.player, this.platforms.group, (player) => {
      if (player.body.touching.down && player.body.velocity.y >= 0) player.bounce();
    });

    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,D,R');
    this.touchDirection = 0;
    this.createTouchZones();
    this.highestCameraY = 0;
    this.gameOver = false;
    this.add.text(195, 28, 'CLIMB!', { fontSize: '22px', fontStyle: 'bold', color: '#173c36' }).setOrigin(0.5).setScrollFactor(0);
  }

  createTouchZones() {
    const makeZone = (x, direction, label) => {
      const zone = this.add.zone(x, 724, 195, 240).setScrollFactor(0).setInteractive();
      this.add.text(x, 770, label, { fontSize: '54px', color: '#173c3677' }).setOrigin(0.5).setScrollFactor(0);
      zone.on('pointerdown', () => { this.touchDirection = direction; });
      zone.on('pointerup', () => { if (this.touchDirection === direction) this.touchDirection = 0; });
      zone.on('pointerout', (pointer) => { if (!pointer.isDown && this.touchDirection === direction) this.touchDirection = 0; });
    };
    makeZone(97.5, -1, '◀'); makeZone(292.5, 1, '▶');
    this.input.on('pointerup', () => { this.touchDirection = 0; });
  }

  update() {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.restart();
      return;
    }
    const keyboardDirection = (this.keys.LEFT.isDown || this.keys.A.isDown ? -1 : 0) + (this.keys.RIGHT.isDown || this.keys.D.isDown ? 1 : 0);
    this.player.move(keyboardDirection || this.touchDirection);
    if (this.player.x < -17) this.player.x = 407;
    if (this.player.x > 407) this.player.x = -17;

    const desiredScroll = this.player.y - 500;
    this.highestCameraY = Math.min(this.highestCameraY, desiredScroll);
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, this.highestCameraY, 0.08);
    if (this.player.y > this.cameras.main.scrollY + 920) this.showGameOver();
  }

  showGameOver() {
    this.gameOver = true;
    this.physics.pause();
    this.add.rectangle(195, 422, 330, 190, 0x102d2a, 0.92).setScrollFactor(0);
    this.add.text(195, 390, 'RUN OVER', { fontSize: '35px', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0);
    const restart = this.add.text(195, 460, 'TAP TO RESTART', { fontSize: '20px', backgroundColor: '#f3b942', color: '#173c36', padding: { x: 18, y: 12 } }).setOrigin(0.5).setScrollFactor(0).setInteractive();
    restart.on('pointerdown', () => this.scene.restart());
  }
}
