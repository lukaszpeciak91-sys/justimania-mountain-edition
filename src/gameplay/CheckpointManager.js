import { ASSETS, textureAvailable } from '../assets.js';

// Final researched milestone data will be supplied separately from this renderer.
export const CHECKPOINTS = Object.freeze([]);

export default class CheckpointManager {
  constructor(scene, checkpoints = CHECKPOINTS) {
    this.scene = scene;
    this.checkpoints = checkpoints;
    this.spawned = new Map();
  }

  update(ascent, platforms) {
    this.checkpoints.forEach((checkpoint) => {
      if (ascent < checkpoint.ascentThreshold || this.spawned.has(checkpoint.id)) return;
      const platform = platforms.platforms.reduce((best, item) => (
        !best || Math.abs(item.y - platforms.highestY) < Math.abs(best.y - platforms.highestY) ? item : best
      ), null);
      if (platform) this.spawn(checkpoint, platform);
    });
  }

  spawn(checkpoint, platform) {
    const container = this.scene.add.container(platform.x, platform.y - 70);
    if (textureAvailable(this.scene, ASSETS.checkpointSign)) {
      container.add(this.scene.add.image(0, 0, ASSETS.checkpointSign.key).setDisplaySize(126, 92));
    } else {
      container.add(this.scene.add.rectangle(0, 0, 126, 78, 0x6f4829).setStrokeStyle(3, 0x3f291b));
    }
    container.add(this.scene.add.text(0, -2, `${checkpoint.name}\n${checkpoint.elevationMeters} m`, {
      align: 'center', color: '#fff9df', fontFamily: 'system-ui', fontSize: '16px', fontStyle: 'bold',
      stroke: '#28180d', strokeThickness: 3,
    }).setOrigin(0.5));
    this.spawned.set(checkpoint.id, container);
  }

  destroy() {
    this.spawned.forEach((object) => object.destroy());
    this.spawned.clear();
  }
}
