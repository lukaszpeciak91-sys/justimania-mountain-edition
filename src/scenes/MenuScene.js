import Phaser from 'phaser';
import { ASSETS, textureAvailable } from '../assets.js';
import { createGameButton } from '../ui/gameButton.js';
import { createMenuState } from '../ui/menuState.js';
import { MENU_FOREGROUND, menuForegroundLayout } from '../ui/menuForeground.js';
import { selectEdition, selectedEdition } from '../config/editionState.js';

const MENU_DRIFT = { x: 9, y: 6, duration: 9000 };
const REVEAL_DURATION = 650;
const START_FADE_DURATION = 280;
const MENU_DEPTH = Object.freeze({ background: 0, foreground: MENU_FOREGROUND.depth, title: 20, start: 30 });

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  init(data) {
    this.edition = data?.editionId
      ? selectEdition(this.registry, data.editionId)
      : selectedEdition(this.registry);
  }

  create() {
    const { width, height } = this.scale;
    this.menuState = createMenuState();
    this.menuTweens = [];
    const menuBackground = this.edition.menuBackground;
    this.cameras.main.setBackgroundColor(this.edition.id === 'beach' ? '#101516' : '#173c36');
    if (textureAvailable(this, menuBackground)) {
      const source = this.textures.get(menuBackground.key).getSourceImage();
      const scale = Math.max((width + MENU_DRIFT.x * 2) / source.width, (height + MENU_DRIFT.y * 2) / source.height);
      const background = this.add.image(width / 2, height / 2, menuBackground.key).setScale(scale).setDepth(MENU_DEPTH.background);
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
      this.add.rectangle(width / 2, height / 2, width, height, this.edition.id === 'beach' ? 0x101516 : 0x173c36).setDepth(MENU_DEPTH.background);
    }
    this.createMenuForeground(width, height);
    this.add.text(width / 2, height * 0.225, 'JUSTIMANIA', {
      fontFamily: 'Bungee, "Arial Black", sans-serif',
      fontSize: '45px',
      color: '#fff1b8',
      stroke: '#173c36',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 4, color: '#0d2b28', blur: 0, fill: true },
    }).setOrigin(0.5).setDepth(MENU_DEPTH.title);

    this.subtitle = this.add.text(width / 2, height * 0.305, this.edition.label, {
      fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif',
      fontSize: '24px',
      fontStyle: 'italic bold',
      letterSpacing: 2.4,
      color: '#e85f50',
      stroke: '#592f2a',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(MENU_DEPTH.title);
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
      depth: MENU_DEPTH.start,
    }).setAlpha(0);
    this.input.on('pointerdown', this.handleRevealTap);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUp, this);
  }

  createMenuForeground(width, height) {
    const menuForeground = this.edition.menuForeground;
    if (!textureAvailable(this, menuForeground)) return;
    const source = this.textures.get(menuForeground.key).getSourceImage();
    const layout = menuForegroundLayout(source.width, source.height, width, height);
    if (!layout) return;
    this.menuForeground = this.add.image(layout.x, layout.y, menuForeground.key)
      .setOrigin(0.5, 1)
      .setScale(layout.scaleX)
      .setDepth(MENU_DEPTH.foreground)
      .setAlpha(0);
    this.menuForegroundRestY = layout.y;
    this.menuForeground.y += MENU_FOREGROUND.entranceOffset;
  }

  beginReveal() {
    if (!this.menuState.beginReveal()) return;
    const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const duration = reducedMotion ? 1 : REVEAL_DURATION;
    if (this.menuForeground) {
      this.foregroundTween = this.tweens.add({
        targets: this.menuForeground,
        alpha: 1,
        y: this.menuForegroundRestY,
        duration: reducedMotion ? MENU_FOREGROUND.reducedMotionDuration : MENU_FOREGROUND.duration,
        ease: MENU_FOREGROUND.ease,
      });
      this.menuTweens.push(this.foregroundTween);
    }
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
      targets: [this.startButton.visual, this.startButton.inputTarget],
      alpha: 1,
      y: this.scale.height * 0.60,
      duration: reducedMotion ? 1 : START_FADE_DURATION,
      ease: 'Quad.easeOut',
    }));
  }

  startGame() {
    if (!this.menuState.beginStart()) return;
    this.startButton.disable();
    this.scene.start('GameScene', { editionId: this.edition.id });
  }

  cleanUp() {
    this.input.off('pointerdown', this.handleRevealTap);
    this.startButton?.destroy();
    const foregroundTween = this.foregroundTween;
    foregroundTween?.remove();
    this.foregroundTween = null;
    this.menuForeground?.destroy();
    this.menuForeground = null;
    this.menuForegroundRestY = null;
    this.menuTweens?.filter((tween) => tween !== foregroundTween).forEach((tween) => tween.remove());
    this.menuTweens = [];
    this.subtitle?.clearMask(false);
    this.revealMask?.destroy();
    this.revealMask = null;
  }
}
