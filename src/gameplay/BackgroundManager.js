export default class BackgroundManager {
  constructor(scene) { this.scene = scene; }
  create() {
    this.scene.add.rectangle(195, 422, 390, 844, 0xb9e4e8).setScrollFactor(0);
    this.scene.add.triangle(80, 570, -100, 250, 80, -40, 250, 250, 0x86aaa0).setScrollFactor(0.08);
    this.scene.add.triangle(310, 610, 80, 300, 300, -70, 520, 300, 0x668d82).setScrollFactor(0.13);
  }
}
