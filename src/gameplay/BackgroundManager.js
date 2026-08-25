import { ASSETS, textureAvailable } from '../assets.js';

const LAYERS = [
  { asset: ASSETS.gameSky, factor: 0.015, alpha: 1 },
  { asset: ASSETS.mountainsFar, factor: 0.06, alpha: 1 },
  { asset: ASSETS.mountainsMid, factor: 0.12, alpha: 1 },
];

export default class BackgroundManager {
  constructor(scene) {
    this.scene = scene;
    this.layers = [];
  }

  create() {
    const fallback = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(-20);
    fallback.add([
      this.scene.add.rectangle(195, 422, 390, 844, 0xb9e4e8),
      this.scene.add.triangle(80, 570, -100, 250, 80, -40, 250, 250, 0x86aaa0),
      this.scene.add.triangle(310, 610, 80, 300, 300, -70, 520, 300, 0x668d82),
    ]);

    LAYERS.forEach(({ asset, factor, alpha }, index) => {
      if (!textureAvailable(this.scene, asset)) return;
      const layer = this.scene.add.tileSprite(195, 422, 390, 844, asset.key)
        .setScrollFactor(0)
        .setDepth(-19 + index)
        .setAlpha(alpha);
      const source = this.scene.textures.get(asset.key).getSourceImage();
      layer.setTileScale(Math.max(390 / source.width, 844 / source.height));
      this.layers.push({ object: layer, factor });
    });
  }

  update(cameraY) {
    this.layers.forEach(({ object, factor }) => { object.tilePositionY = cameraY * factor; });
  }
}
