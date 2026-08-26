import { ASSETS, textureAvailable } from '../assets.js';
import {
  CHECKPOINT_DECORATION_SPEC,
  CHECKPOINT_TEXT_LAYOUT,
  CHECKPOINT_VISUALS,
  MOUNTAIN_CHECKPOINTS,
  WORLD_DEPTH,
} from './checkpointData.js';
import { PLATFORM_HEIGHT } from './PlatformManager.js';
import { isOverheadClear, isRouteReachable, PLATFORM_GENERATION } from './difficulty.js';

export { MOUNTAIN_CHECKPOINTS as CHECKPOINTS } from './checkpointData.js';

const PLATFORM_VISUAL_TOP = -PLATFORM_HEIGHT / 2;
const GEOMETRIC_ARTWORK_BOTTOM = PLATFORM_VISUAL_TOP + CHECKPOINT_VISUALS.platformTopOverlap;
const GEOMETRIC_SIGN_CENTER = GEOMETRIC_ARTWORK_BOTTOM - CHECKPOINT_VISUALS.signHeight / 2;
export const CHECKPOINT_BASELINES = Object.freeze({
  geometricArtworkBottom: GEOMETRIC_ARTWORK_BOTTOM,
  geometricSignCenter: GEOMETRIC_SIGN_CENTER,
  signCenter: GEOMETRIC_SIGN_CENTER + CHECKPOINT_VISUALS.signVisualDrop,
  kayaBottom: GEOMETRIC_ARTWORK_BOTTOM + CHECKPOINT_VISUALS.kayaVisualDrop,
});

export class CheckpointProgress {
  constructor(checkpoints = MOUNTAIN_CHECKPOINTS) {
    this.checkpoints = checkpoints;
    this.states = new Map(checkpoints.map((checkpoint) => [checkpoint.id, 'pending']));
    this.platforms = new Map();
    this.nextIndex = 0;
  }

  claimRoute(routeSpec) {
    const checkpoint = this.checkpoints[this.nextIndex];
    const ascent = 790 - routeSpec.y;
    if (!checkpoint || ascent < checkpoint.ascentThreshold) return null;
    this.states.set(checkpoint.id, 'spawned');
    this.platforms.set(checkpoint.id, routeSpec);
    this.nextIndex += 1;
    return checkpoint;
  }

  reach(id) {
    const checkpoint = this.checkpoints.find((item) => item.id === id);
    if (!checkpoint || this.states.get(id) !== 'spawned') return null;
    const earlierReached = this.checkpoints.slice(0, this.checkpoints.indexOf(checkpoint))
      .every((item) => this.states.get(item.id) === 'reached');
    if (!earlierReached) return null;
    this.states.set(id, 'reached');
    return checkpoint;
  }

  state(id) { return this.states.get(id); }
}

/** Rebuild a checkpoint layer after ordinary generation and revalidate every
 * accepted geometry against Generator V2's existing route/clearance rules. */
export function checkpointLayerGeometry(layer, previousLayer, checkpoint) {
  const original = layer.route;
  const desiredWidth = checkpoint.finalSummit ? 230 : 184;
  const minimumWidth = original.width;
  const widths = [];
  for (let width = Math.max(desiredWidth, minimumWidth); width >= minimumWidth; width -= 2) widths.push(width);
  if (!widths.includes(minimumWidth)) widths.push(minimumWidth);

  for (const width of widths) {
    const minX = Math.ceil(PLATFORM_GENERATION.worldMargin + width / 2);
    const maxX = Math.floor(390 - PLATFORM_GENERATION.worldMargin - width / 2);
    const positions = Array.from({ length: maxX - minX + 1 }, (_, index) => minX + index)
      .sort((a, b) => Math.abs(a - original.x) - Math.abs(b - original.x));
    for (const x of positions) {
      const route = {
        ...original,
        x,
        width,
        role: checkpoint.finalSummit ? 'summit-route' : 'checkpoint-route',
        checkpointId: checkpoint.id,
        finalSummit: checkpoint.finalSummit,
      };
      const previousRoute = previousLayer.route ?? previousLayer;
      const previousPlatforms = previousLayer.platforms ?? [previousRoute];
      if (isRouteReachable(previousRoute, route)
          && previousPlatforms.every((platform) => isOverheadClear(platform, route))) {
        return { ...layer, route, platforms: [route] };
      }
    }
  }
  throw new Error(`Unable to validate checkpoint route for ${checkpoint.id}`);
}

export default class CheckpointManager {
  constructor(scene, checkpoints = MOUNTAIN_CHECKPOINTS) {
    this.scene = scene;
    this.progress = new CheckpointProgress(checkpoints);
    this.decorations = new Map();
    this.ensureKayaFrames();
  }

  ensureKayaFrames() {
    if (!textureAvailable(this.scene, ASSETS.kaya)) return;
    const texture = this.scene.textures.get(ASSETS.kaya.key);
    const source = texture.getSourceImage();
    if (!source?.width || source.width % 3 !== 0) return;
    const frameWidth = source.width / 3;
    for (let index = 0; index < 3; index += 1) {
      if (!texture.has(index)) texture.add(index, 0, index * frameWidth, 0, frameWidth, source.height);
    }
    if (!this.scene.anims.exists('kaya-idle')) {
      this.scene.anims.create({
        key: 'kaya-idle',
        frames: CHECKPOINT_DECORATION_SPEC.kaya.sequence.map((frame) => ({ key: ASSETS.kaya.key, frame })),
        frameRate: CHECKPOINT_DECORATION_SPEC.kaya.frameRate,
        repeat: -1,
      });
    }
  }

  prepareLayer(layer, previousLayer) {
    const checkpoint = this.progress.checkpoints[this.progress.nextIndex];
    if (!checkpoint || 790 - layer.route.y < checkpoint.ascentThreshold) return layer;
    const safeLayer = checkpointLayerGeometry(layer, previousLayer, checkpoint);
    this.progress.claimRoute(safeLayer.route);
    return safeLayer;
  }

  decoratePlatform(platform) {
    if (!platform.checkpointId) return;
    const checkpoint = this.progress.checkpoints.find(({ id }) => id === platform.checkpointId);
    const width = platform.platformWidth;
    const side = platform.x > 195 ? -1 : 1;
    const signX = side * Math.max(38, width / 2 - 62);
    const container = this.scene.add.container(platform.x, platform.y).setDepth(WORLD_DEPTH.checkpointDecoration);
    let sign;
    if (textureAvailable(this.scene, ASSETS.checkpointSign)) {
      sign = this.scene.add.image(signX, CHECKPOINT_BASELINES.signCenter, ASSETS.checkpointSign.key)
        .setDisplaySize(CHECKPOINT_VISUALS.signWidth, CHECKPOINT_VISUALS.signHeight);
    } else {
      sign = this.scene.add.rectangle(signX, CHECKPOINT_BASELINES.signCenter, CHECKPOINT_VISUALS.signWidth, CHECKPOINT_VISUALS.signHeight, 0x6f4829)
        .setStrokeStyle(3, 0x3f291b);
    }
    const nameFontSize = checkpoint.name.length > CHECKPOINT_TEXT_LAYOUT.longNameThreshold
      ? CHECKPOINT_TEXT_LAYOUT.longMountainNameFontSize : CHECKPOINT_TEXT_LAYOUT.mountainNameFontSize;
    const textAnchorX = signX + CHECKPOINT_TEXT_LAYOUT.signTextAnchorX;
    const textAnchorY = CHECKPOINT_BASELINES.signCenter
      + CHECKPOINT_TEXT_LAYOUT.signTextAnchorY + CHECKPOINT_TEXT_LAYOUT.textOffsetY;
    const centerSpacing = nameFontSize / 2 + CHECKPOINT_TEXT_LAYOUT.elevationFontSize / 2
      + CHECKPOINT_TEXT_LAYOUT.lineSpacing;
    const mountainName = this.scene.add.text(textAnchorX, textAnchorY - centerSpacing / 2, checkpoint.name.toLocaleUpperCase('pl-PL'), {
      align: 'center', color: '#fff9df', fontFamily: 'system-ui', fontSize: `${nameFontSize}px`, fontStyle: 'bold',
      stroke: '#28180d', strokeThickness: 3,
    }).setOrigin(0.5);
    const elevation = this.scene.add.text(textAnchorX, textAnchorY + centerSpacing / 2, `${checkpoint.elevationMeters} m`, {
      align: 'center', color: '#fff9df', fontFamily: 'system-ui', fontSize: `${CHECKPOINT_TEXT_LAYOUT.elevationFontSize}px`, fontStyle: 'bold',
      stroke: '#28180d', strokeThickness: 3,
    }).setOrigin(0.5);
    container.add([sign, mountainName, elevation]);
    if (this.scene.anims.exists('kaya-idle')) {
      const kayaX = signX - side * 58;
      const kaya = this.scene.add.sprite(kayaX, CHECKPOINT_BASELINES.kayaBottom, ASSETS.kaya.key, 0);
      const frame = this.scene.textures.get(ASSETS.kaya.key).get(0);
      kaya.setScale(Math.min(1, CHECKPOINT_VISUALS.kayaTargetHeight / frame.realHeight)).setOrigin(0.5, 1).play('kaya-idle');
      container.add(kaya);
    }
    this.decorations.set(checkpoint.id, container);
  }

  reachPlatform(platform) { return platform?.checkpointId ? this.progress.reach(platform.checkpointId) : null; }

  markPassed(playerY) {
    for (const checkpoint of this.progress.checkpoints) {
      if (checkpoint.finalSummit || this.progress.state(checkpoint.id) !== 'spawned') continue;
      const platform = this.progress.platforms.get(checkpoint.id);
      if (platform && playerY < platform.y) this.progress.reach(checkpoint.id);
    }
  }

  destroy() {
    this.decorations.forEach((object) => object.destroy());
    this.decorations.clear();
  }
}
