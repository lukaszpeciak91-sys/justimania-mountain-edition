export default class PlatformManager {
  constructor(scene) {
    this.scene = scene;
    this.group = scene.physics.add.staticGroup();
  }

  add(x, y, width = 120) {
    const platform = this.scene.add.rectangle(x, y, width, 20, 0x526f45).setStrokeStyle(3, 0x30462c);
    this.scene.physics.add.existing(platform, true);
    this.group.add(platform);
    return platform;
  }

  createBootstrapCourse() {
    [[195, 790, 230], [90, 650, 130], [285, 515, 130], [125, 375, 125], [285, 235, 130], [155, 90, 130]].forEach((args) => this.add(...args));
  }
}
