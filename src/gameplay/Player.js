import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    if (!scene.textures.exists('player-placeholder')) {
      const graphics = scene.make.graphics({ add: false });
      graphics.fillStyle(0xe85267).fillRoundedRect(0, 0, 34, 48, 9).generateTexture('player-placeholder', 34, 48).destroy();
    }
    super(scene, x, y, 'player-placeholder');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(false).setMaxVelocity(260, 900);
    this.body.setSize(28, 44).setOffset(3, 4);
  }

  move(direction) { this.setVelocityX(direction * 205); }
  bounce() { this.setVelocityY(-570); }
}
