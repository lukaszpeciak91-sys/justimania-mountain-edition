import Phaser from 'phaser';
import { ASSETS, textureAvailable } from '../assets.js';
import { PLATFORM_GENERATION as LIMITS } from './difficulty.js';

const PLATFORM_HEIGHT = 26;

// Provisional source-space ratios until the user-supplied artwork can be inspected
// on a real device. Keeping these relative to the source prevents a large texture
// from receiving arbitrary, tiny pixel slices.
export const PLATFORM_NINE_SLICE = Object.freeze({
  leftCapRatio: 0.18,
  rightCapRatio: 0.18,
  topSliceRatio: 0.22,
  bottomSliceRatio: 0.22,
});

export default class PlatformManager {
  constructor(scene) {
    this.scene = scene;
    this.group = scene.physics.add.staticGroup();
    this.platforms = [];
    this.highestY = 0;
    this.lastX = 195;
  }

  add(x, y, width = 120) {
    let platform;
    if (textureAvailable(this.scene, ASSETS.platform)) {
      const source = this.scene.textures.get(ASSETS.platform.key).getSourceImage();
      const renderScale = PLATFORM_HEIGHT / source.height;
      const leftCap = Math.round(source.width * PLATFORM_NINE_SLICE.leftCapRatio);
      const rightCap = Math.round(source.width * PLATFORM_NINE_SLICE.rightCapRatio);
      const topSlice = Math.round(source.height * PLATFORM_NINE_SLICE.topSliceRatio);
      const bottomSlice = Math.round(source.height * PLATFORM_NINE_SLICE.bottomSliceRatio);
      platform = this.scene.add.nineslice(
        x,
        y,
        ASSETS.platform.key,
        null,
        width / renderScale,
        source.height,
        leftCap,
        rightCap,
        topSlice,
        bottomSlice,
      ).setScale(renderScale);
    } else {
      platform = this.scene.add.rectangle(x, y, width, 20, 0x526f45).setStrokeStyle(3, 0x30462c);
    }
    this.scene.physics.add.existing(platform, true);
    platform.body
      .setSize(width / platform.scaleX, 18 / platform.scaleY)
      .setOffset(0, 0)
      .updateFromGameObject();
    platform.platformWidth = width;
    this.group.add(platform);
    this.platforms.push(platform);
    return platform;
  }

  createInitialCourse() {
    this.add(195, 790, 230);
    this.highestY = 790;
    this.lastX = 195;
    this.ensureAhead(0);
  }

  ensureAhead(cameraY) {
    const targetY = cameraY - LIMITS.generateAhead;
    while (this.highestY > targetY) this.generateNext();
  }

  generateNext() {
    const gap = Phaser.Math.Between(LIMITS.verticalGapMin, LIMITS.verticalGapMax);
    const width = Phaser.Math.Between(LIMITS.widthMin, LIMITS.widthMax);
    const minX = LIMITS.worldMargin + width / 2;
    const maxX = 390 - LIMITS.worldMargin - width / 2;
    const x = Phaser.Math.Clamp(
      this.lastX + Phaser.Math.Between(-LIMITS.horizontalStepMax, LIMITS.horizontalStepMax),
      minX,
      maxX,
    );
    this.highestY -= gap;
    this.lastX = x;
    return this.add(x, this.highestY, width);
  }

  prune(cameraY) {
    const cutoff = cameraY + LIMITS.removeBelowCamera;
    this.platforms = this.platforms.filter((platform) => {
      if (platform.y <= cutoff) return true;
      this.group.remove(platform, true, true);
      return false;
    });
  }

  update(cameraY) {
    this.ensureAhead(cameraY);
    this.prune(cameraY);
  }

  destroy() {
    this.group.clear(true, true);
    this.platforms = [];
  }
}
