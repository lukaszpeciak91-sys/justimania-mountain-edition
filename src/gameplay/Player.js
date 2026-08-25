import Phaser from 'phaser';
import { ASSETS, textureAvailable } from '../assets.js';
import { BOOTSTRAP_HORIZONTAL_SPEED, BOOTSTRAP_JUMP_VELOCITY } from './difficulty.js';

export const PLAYER_FRAMES = Object.freeze({ idle: 0, jump: 1, fall: 2, land: 3 });
const LAND_FRAME_MS = 85;
export const PLAYER_DISPLAY_SIZE = 100;
export const PLAYER_VISIBLE_WRAP_WIDTH = 72;

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
      this.setDisplaySize(PLAYER_DISPLAY_SIZE, PLAYER_DISPLAY_SIZE);
      // Source-space body stays around the torso, legs and feet, independent of
      // the transparent frame and the larger rendered artwork.
      this.body.setSize(260, 510).setOffset(254, 178);
      this.wrapWidth = PLAYER_VISIBLE_WRAP_WIDTH;
    } else {
      this.body.setSize(28, 44).setOffset(3, 4);
      this.wrapWidth = 34;
    }
  }

  move(direction) {
    this.setVelocityX(direction * BOOTSTRAP_HORIZONTAL_SPEED);
    if (direction) this.setFlipX(direction < 0);
  }

  bounce() {
    if (this.hasArt) this.setFrame(PLAYER_FRAMES.land);
    this.landingUntil = this.scene.time.now + LAND_FRAME_MS;
    this.setVelocityY(BOOTSTRAP_JUMP_VELOCITY);
  }

  updateState() {
    if (!this.hasArt) return;
    if (this.scene.time.now < this.landingUntil) return;
    if (this.body.velocity.y < -35) this.setFrame(PLAYER_FRAMES.jump);
    else if (this.body.velocity.y > 35) this.setFrame(PLAYER_FRAMES.fall);
    else this.setFrame(PLAYER_FRAMES.idle);
  }
}
