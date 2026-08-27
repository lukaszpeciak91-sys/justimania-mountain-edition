import Phaser from 'phaser';
import { ASSETS, textureAvailable } from '../assets.js';
import { BOOTSTRAP_HORIZONTAL_SPEED } from './difficulty.js';
import {
  PLAYER_COLLISION_BODY,
  PLAYER_DISPLAY_SIZE,
  PLAYER_START_POSITION,
  PLAYER_VISIBLE_WRAP_WIDTH,
} from './playerProfile.js';
import { WORLD_DEPTH } from './checkpointData.js';
import {
  airborneFrameForVelocity,
  beginLandingVisual,
  PLAYER_FRAMES,
} from './playerAnimation.js';

export { PLAYER_DISPLAY_SIZE, PLAYER_START_POSITION, PLAYER_VISIBLE_WRAP_WIDTH } from './playerProfile.js';
export { LAND_FRAME_MS, PLAYER_FRAMES } from './playerAnimation.js';

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
    this.setDepth(WORLD_DEPTH.player);
    this.landingUntil = 0;
    this.setCollideWorldBounds(false).setMaxVelocity(260, 900);
    if (hasArt) {
      this.setDisplaySize(PLAYER_DISPLAY_SIZE, PLAYER_DISPLAY_SIZE);
      // Source-space body stays around the torso, legs and feet, independent of
      // the transparent frame and the larger rendered artwork.
      // Preserve the previous ~34 x 66 world-unit collision geometry while
      // enlarging only the rendered frame. The offset keeps feet aligned.
      this.body
        .setSize(PLAYER_COLLISION_BODY.width, PLAYER_COLLISION_BODY.height)
        .setOffset(PLAYER_COLLISION_BODY.offsetX, PLAYER_COLLISION_BODY.offsetY);
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
    beginLandingVisual(this, this.scene.time.now);
  }

  updateState() {
    if (!this.hasArt) return;
    if (this.scene.time.now < this.landingUntil) return;
    this.setFrame(airborneFrameForVelocity(this.body.velocity.y));
  }
}
