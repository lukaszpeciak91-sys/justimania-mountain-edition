import { ASSETS, textureAvailable } from '../assets.js';

export const BACKGROUND_PARALLAX = Object.freeze({
  sky: 0.015,
  far: 0.06,
  mid: 0.12,
});

const TRANSITION_START = 0.68;
const VARIANTS = Object.freeze([
  { x: -10, scale: 1.025 },
  { x: 8, scale: 1.04 },
  { x: -3, scale: 1.015 },
  { x: 12, scale: 1.03 },
]);

const MOUNTAIN_LAYERS = Object.freeze([
  { asset: ASSETS.mountainsFar, factor: BACKGROUND_PARALLAX.far, interval: 1800, depth: -18 },
  { asset: ASSETS.mountainsMid, factor: BACKGROUND_PARALLAX.mid, interval: 1200, depth: -16 },
]);

function smoothstep(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * Produces two overlapping compositions. The outgoing image becomes completely
 * transparent before it is recycled, so a non-seamless texture edge is never
 * joined directly to another edge.
 */
export function mountainLayerState(cameraY, { factor, interval }) {
  const ascent = Math.max(0, -cameraY);
  const cycle = Math.floor(ascent / interval);
  const progress = (ascent % interval) / interval;
  const blend = smoothstep((progress - TRANSITION_START) / (1 - TRANSITION_START));
  const travel = interval * factor;

  return [
    {
      composition: cycle,
      alpha: 1 - blend,
      yOffset: -progress * travel,
    },
    {
      composition: cycle + 1,
      alpha: blend,
      yOffset: (1 - progress) * travel,
    },
  ];
}

export default class BackgroundManager {
  constructor(scene) {
    this.scene = scene;
    this.sky = null;
    this.layers = [];
  }

  create() {
    const { width, height } = this.scene.scale;
    this.scene.cameras.main.setBackgroundColor('#b9e4e8');
    this.fallback = this.scene.add.rectangle(width / 2, height / 2, width, height, 0xb9e4e8)
      .setScrollFactor(0)
      .setDepth(-20);

    if (textureAvailable(this.scene, ASSETS.gameSky)) {
      this.sky = this.createCoverImage(ASSETS.gameSky.key, -19, 48);
    }

    MOUNTAIN_LAYERS.forEach((config) => {
      if (!textureAvailable(this.scene, config.asset)) return;
      const objects = [0, 1].map(() => this.createCoverImage(config.asset.key, config.depth, 200));
      this.layers.push({ config, objects });
    });
    this.reset();
  }

  createCoverImage(key, depth, overscan) {
    const { width, height } = this.scene.scale;
    const source = this.scene.textures.get(key).getSourceImage();
    const coverScale = Math.max((width + overscan) / source.width, (height + overscan) / source.height);
    const image = this.scene.add.image(width / 2, height / 2, key)
      .setScrollFactor(0)
      .setDepth(depth)
      .setScale(coverScale);
    image.backgroundCoverScale = coverScale;
    return image;
  }

  update(cameraY) {
    const { width, height } = this.scene.scale;
    if (this.sky) {
      // The oversized sky moves almost imperceptibly and always covers the camera.
      this.sky.setPosition(width / 2, height / 2 + Math.max(-18, Math.min(18, cameraY * BACKGROUND_PARALLAX.sky)));
    }

    this.layers.forEach(({ config, objects }) => {
      mountainLayerState(cameraY, config).forEach((state, index) => {
        const variant = VARIANTS[state.composition % VARIANTS.length];
        objects[index]
          .setPosition(width / 2 + variant.x, height / 2 + state.yOffset)
          .setScale(objects[index].backgroundCoverScale * variant.scale)
          .setAlpha(state.alpha);
      });
    });
  }

  reset() {
    this.update(0);
  }

  destroy() {
    this.sky?.destroy();
    this.fallback?.destroy();
    this.layers.forEach(({ objects }) => objects.forEach((object) => object.destroy()));
    this.sky = null;
    this.fallback = null;
    this.layers = [];
  }
}
