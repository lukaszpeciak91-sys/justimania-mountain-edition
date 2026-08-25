import Phaser from 'phaser';
import { ASSETS, textureAvailable } from '../assets.js';
import { createGameButton } from '../ui/gameButton.js';
import { createMenuState } from '../ui/menuState.js';

const MENU_DRIFT = { x: 9, y: 6, duration: 9000 };
const REVEAL_DURATION = 650;
const START_FADE_DURATION = 280;

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;
    this.menuState = createMenuState();
    this.menuTweens = [];
    this.cameras.main.setBackgroundColor('#173c36');
    if (textureAvailable(this, ASSETS.menuBackground)) {
      const source = this.textures.get(ASSETS.menuBackground.key).getSourceImage();
      const scale = Math.max((width + MENU_DRIFT.x * 2) / source.width, (height + MENU_DRIFT.y * 2) / source.height);
      const background = this.add.image(width / 2, height / 2, ASSETS.menuBackground.key).setScale(scale);
      this.tweens.add({
        targets: background,
        x: width / 2 + MENU_DRIFT.x,
        y: height / 2 + MENU_DRIFT.y,
        duration: MENU_DRIFT.duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, 0x173c36);
    }
    this.add.text(width / 2, height * 0.225, 'JUSTIMANIA', {
      fontFamily: 'Bungee, "Arial Black", sans-serif',
      fontSize: '45px',
      color: '#fff1b8',
      stroke: '#173c36',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 4, color: '#0d2b28', blur: 0, fill: true },
    }).setOrigin(0.5);

    this.subtitle = this.add.text(width / 2, height * 0.305, 'MOUNTAIN EDITION', {
      fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif',
      fontSize: '24px',
      fontStyle: 'italic bold',
      letterSpacing: 2.4,
      color: '#e85f50',
      stroke: '#592f2a',
      strokeThickness: 2,
    }).setOrigin(0.5);
    const subtitleBounds = this.subtitle.getBounds();
    this.revealShape = this.make.graphics({ add: false }).fillStyle(0xffffff).fillRect(
      subtitleBounds.left,
      subtitleBounds.top - 2,
      subtitleBounds.width,
      subtitleBounds.height + 4,
    );
    this.revealMask = this.revealShape.createGeometryMask();
    this.subtitle.setMask(this.revealMask);
    this.revealShape.scaleX = 0;

    this.handleRevealTap = () => this.beginReveal();
    this.handleStartTap = () => this.startGame();
    this.startButton = createGameButton(this, {
      x: width / 2,
      y: height * 0.60 + 8,
      label: 'START',
      width: 190,
      height: 68,
      fontSize: 31,
      onPress: this.handleStartTap,
      interactive: false,
    }).setAlpha(0);
    this.input.on('pointerdown', this.handleRevealTap);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUp, this);
  }

  beginReveal() {
    if (!this.menuState.beginReveal()) return;
    const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const duration = reducedMotion ? 1 : REVEAL_DURATION;
    this.menuTweens.push(this.tweens.add({
      targets: this.revealShape,
      scaleX: 1,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => this.showStart(reducedMotion),
    }));
  }

  showStart(reducedMotion) {
    if (!this.menuState.completeReveal()) return;
    this.subtitle.clearMask(false);
    this.revealMask.destroy();
    this.revealMask = null;
    this.startButton.enable();
    this.menuTweens.push(this.tweens.add({
      targets: [this.startButton.visual, this.startButton.hitTarget],
      alpha: 1,
      y: this.scale.height * 0.60,
      duration: reducedMotion ? 1 : START_FADE_DURATION,
      ease: 'Quad.easeOut',
    }));
  }

  startGame() {
    if (!this.menuState.beginStart()) return;
    this.startButton.disable();
    this.scene.start('GameScene');
  }

  cleanUp() {
    this.input.off('pointerdown', this.handleRevealTap);
    this.startButton?.destroy();
    this.menuTweens?.forEach((tween) => tween.remove());
    this.menuTweens = [];
    this.subtitle?.clearMask(false);
    this.revealMask?.destroy();
    this.revealMask = null;
  }
}
