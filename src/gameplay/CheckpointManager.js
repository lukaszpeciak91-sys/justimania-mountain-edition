import { ASSETS, textureAvailable } from '../assets.js';
import { CHECKPOINT_DECORATION_SPEC, MOUNTAIN_CHECKPOINTS } from './checkpointData.js';

export { MOUNTAIN_CHECKPOINTS as CHECKPOINTS } from './checkpointData.js';

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

  prepareRouteSpec(routeSpec) {
    const checkpoint = this.progress.claimRoute(routeSpec);
    if (!checkpoint) return routeSpec;
    routeSpec.checkpointId = checkpoint.id;
    routeSpec.finalSummit = checkpoint.finalSummit;
    if (checkpoint.finalSummit) {
      routeSpec.role = 'summit-route';
      routeSpec.width = 230;
      routeSpec.x = Math.max(139, Math.min(251, routeSpec.x));
    } else {
      routeSpec.width = Math.max(routeSpec.width, 184);
      const halfWidth = routeSpec.width / 2;
      routeSpec.x = Math.max(24 + halfWidth, Math.min(366 - halfWidth, routeSpec.x));
    }
    return routeSpec;
  }

  decoratePlatform(platform) {
    if (!platform.checkpointId) return;
    const checkpoint = this.progress.checkpoints.find(({ id }) => id === platform.checkpointId);
    const width = platform.platformWidth;
    const side = platform.x > 195 ? -1 : 1;
    const signX = side * Math.max(26, width / 2 - 52);
    const container = this.scene.add.container(platform.x, platform.y).setDepth(4);
    let sign;
    if (textureAvailable(this.scene, ASSETS.checkpointSign)) {
      sign = this.scene.add.image(signX, -61, ASSETS.checkpointSign.key).setDisplaySize(104, 78);
    } else {
      sign = this.scene.add.rectangle(signX, -61, 104, 70, 0x6f4829).setStrokeStyle(3, 0x3f291b);
    }
    const fontSize = checkpoint.name.length > 16 ? 11 : 13;
    const text = this.scene.add.text(signX, -62, `${checkpoint.name.toLocaleUpperCase('pl-PL')}\n${checkpoint.elevationMeters} m`, {
      align: 'center', color: '#fff9df', fontFamily: 'system-ui', fontSize: `${fontSize}px`, fontStyle: 'bold',
      stroke: '#28180d', strokeThickness: 3,
    }).setOrigin(0.5);
    container.add([sign, text]);
    if (this.scene.anims.exists('kaya-idle')) {
      const kayaX = signX - side * 58;
      const kaya = this.scene.add.sprite(kayaX, -29, ASSETS.kaya.key, 0);
      const frame = this.scene.textures.get(ASSETS.kaya.key).get(0);
      kaya.setScale(Math.min(1, 70 / frame.realHeight)).setOrigin(0.5, 1).play('kaya-idle');
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
