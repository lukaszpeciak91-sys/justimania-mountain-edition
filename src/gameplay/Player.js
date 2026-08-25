import Phaser from 'phaser';
import { ASSETS, textureAvailable } from '../assets.js';

export const PLAYER_FRAMES = Object.freeze({ idle: 0, jump: 1, fall: 2, land: 3 });
const LAND_FRAME_MS = 85;

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    if (!scene.textures.exists('player-placeholder')) {
      const graphics = scene.make.graphics({ add: false });
      graphics.fillStyle(0xe85267).fillRoundedRect(0, 0, 34, 48, 9).generateTexture('player-placeholder', 34, 48).destroy();
    }
    const hasArt = textureAvailable(scene, ASSETS.player);
    super(scene, x, y, hasArt ? ASSETS.player.key : 'player-placeholder', hasArt ? PLAYER_FRAMES.idle : undefined);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.hasArt = hasArt;
    this.landingUntil = 0;
    this.setCollideWorldBounds(false).setMaxVelocity(260, 900);
    if (hasArt) {
      this.setDisplaySize(58, 58);
      this.body.setSize(300, 560).setOffset(234, 155);
    } else {
      this.body.setSize(28, 44).setOffset(3, 4);
    }
  }

  move(direction) {
    this.setVelocityX(direction * 205);
    if (direction) this.setFlipX(direction < 0);
  }

  bounce() {
    if (this.hasArt) this.setFrame(PLAYER_FRAMES.land);
    this.landingUntil = this.scene.time.now + LAND_FRAME_MS;
    this.setVelocityY(-570);
  }

  updateState() {
    if (!this.hasArt) return;
    if (this.scene.time.now < this.landingUntil) return;
    if (this.body.velocity.y < -35) this.setFrame(PLAYER_FRAMES.jump);
    else if (this.body.velocity.y > 35) this.setFrame(PLAYER_FRAMES.fall);
    else this.setFrame(PLAYER_FRAMES.idle);
  }
}
