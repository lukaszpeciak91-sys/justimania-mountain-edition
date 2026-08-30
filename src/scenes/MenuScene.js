import Phaser from 'phaser';
import { textureAvailable } from '../assets.js';
import { createMenuState } from '../ui/menuState.js';
import { hideMenuControls, showMenuControls } from '../ui/menuControls.js';
import { MENU_FOREGROUND, menuForegroundLayout } from '../ui/menuForeground.js';
import { selectEdition, selectedEdition } from '../config/editionState.js';

const MENU_DRIFT = { x: 9, y: 6, duration: 9000 };
const MENU_DEPTH = Object.freeze({ background: 0, foreground: MENU_FOREGROUND.depth, title: 20 });

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  init(data) {
    this.edition = data?.editionId
      ? selectEdition(this.registry, data.editionId)
      : selectedEdition(this.registry);
  }

  create() {
    const { width, height } = this.scale;
    hideMenuControls();
    this.menuState = createMenuState();
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
    showMenuControls(() => this.startGame(), () => this.returnToEditionSelect());
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
    const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.foregroundTween = this.tweens.add({
      targets: this.menuForeground,
      alpha: 1,
      y: this.menuForegroundRestY,
      duration: reducedMotion ? MENU_FOREGROUND.reducedMotionDuration : MENU_FOREGROUND.duration,
      ease: MENU_FOREGROUND.ease,
    });
  }

  startGame() {
    if (!this.menuState.beginStart()) return;
    this.scene.start('GameScene', { editionId: this.edition.id });
  }

  returnToEditionSelect() {
    window.location.reload();
  }

  cleanUp() {
    hideMenuControls();
    this.foregroundTween?.remove();
    this.foregroundTween = null;
    this.menuForeground?.destroy();
    this.menuForeground = null;
    this.menuForegroundRestY = null;
  }
}
