import { ASSETS, textureAvailable } from '../assets.js';
import {
  generatePlatformLayer,
  PLATFORM_GENERATION as LIMITS,
  START_FLOOR_SPEC,
} from './difficulty.js';

export const PLATFORM_HEIGHT = 48;
const PLATFORM_COLLIDER_HEIGHT = 14;

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
  constructor(scene, checkpointManager = null) {
    this.scene = scene;
    this.group = scene.physics.add.staticGroup();
    this.platforms = [];
    this.highestY = 0;
    this.layers = [];
    this.routePlatform = START_FLOOR_SPEC;
    this.nextLayerId = 1;
    this.checkpointManager = checkpointManager;
  }

  add(specOrX, y, width = 120) {
    const spec = typeof specOrX === 'object'
      ? specOrX
      : { x: specOrX, y, width, role: 'secondary', layerId: null };
    let platform;
    if (textureAvailable(this.scene, ASSETS.platform)) {
      const source = this.scene.textures.get(ASSETS.platform.key).getSourceImage();
      const renderScale = PLATFORM_HEIGHT / source.height;
      const leftCap = Math.round(source.width * PLATFORM_NINE_SLICE.leftCapRatio);
      const rightCap = Math.round(source.width * PLATFORM_NINE_SLICE.rightCapRatio);
      const topSlice = Math.round(source.height * PLATFORM_NINE_SLICE.topSliceRatio);
      const bottomSlice = Math.round(source.height * PLATFORM_NINE_SLICE.bottomSliceRatio);
      platform = this.scene.add.nineslice(
        spec.x,
        spec.y,
        ASSETS.platform.key,
        null,
        spec.width / renderScale,
        source.height,
        leftCap,
        rightCap,
        topSlice,
        bottomSlice,
      ).setScale(renderScale);
    } else {
      platform = this.scene.add.rectangle(spec.x, spec.y, spec.width, 20, 0x526f45).setStrokeStyle(3, 0x30462c);
    }
    this.scene.physics.add.existing(platform, true);
    platform.body
      .setSize(spec.width / platform.scaleX, PLATFORM_COLLIDER_HEIGHT / platform.scaleY)
      .setOffset(0, 0)
      .updateFromGameObject();
    // Platforms are landing surfaces, never solid ceilings. Generator V2 also
    // reserves geometric corridors, while this one-way collision guarantees an
    // upward-moving player cannot be trapped by an optional ledge.
    platform.body.checkCollision.down = false;
    platform.body.checkCollision.left = false;
    platform.body.checkCollision.right = false;
    platform.platformWidth = spec.width;
    platform.platformRole = spec.role;
    platform.layerId = spec.layerId;
    platform.checkpointId = spec.checkpointId ?? null;
    platform.finalSummit = spec.finalSummit ?? false;
    this.group.add(platform);
    this.platforms.push(platform);
    this.checkpointManager?.decoratePlatform(platform);
    return platform;
  }

  createInitialCourse() {
    this.add(START_FLOOR_SPEC);
    this.highestY = START_FLOOR_SPEC.y;
    this.layers = [{ id: 0, route: START_FLOOR_SPEC, platforms: [START_FLOOR_SPEC] }];
    this.routePlatform = START_FLOOR_SPEC;
    this.nextLayerId = 1;
    this.ensureAhead(0);
  }

  ensureAhead(cameraY) {
    const targetY = cameraY - LIMITS.generateAhead;
    while (this.highestY > targetY) this.generateNextLayer();
  }

  generateNextLayer() {
    const previousLayer = this.layers.at(-1) ?? this.routePlatform;
    let layer = generatePlatformLayer(previousLayer, this.nextLayerId);
    layer = this.checkpointManager?.prepareLayer(layer, previousLayer) ?? layer;
    layer.platforms.forEach((spec) => this.add(spec));
    this.layers.push(layer);
    this.routePlatform = layer.route;
    this.highestY = layer.route.y;
    this.nextLayerId += 1;
    return layer;
  }

  prune(cameraY) {
    const cutoff = cameraY + LIMITS.removeBelowCamera;
    this.platforms = this.platforms.filter((platform) => {
      if (platform.y <= cutoff) return true;
      this.group.remove(platform, true, true);
      return false;
    });
    this.layers = this.layers.filter((layer) => layer.platforms.some((spec) => spec.y <= cutoff));
  }

  update(cameraY) {
    this.ensureAhead(cameraY);
    this.prune(cameraY);
  }

  destroy() {
    this.group.clear(true, true);
    this.platforms = [];
    this.layers = [];
  }
}
