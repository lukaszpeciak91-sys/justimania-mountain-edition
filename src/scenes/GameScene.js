import Phaser from 'phaser';
import Player from '../gameplay/Player.js';
import { PLAYER_START_POSITION } from '../gameplay/playerProfile.js';
import PlatformManager from '../gameplay/PlatformManager.js';
import BackgroundManager from '../gameplay/BackgroundManager.js';
import AscentTracker from '../gameplay/AscentTracker.js';
import CheckpointManager from '../gameplay/CheckpointManager.js';
import { fellBelowCamera, wrappedHorizontalPosition } from '../gameplay/worldWrap.js';
import { createRunState, enterGameOver, gameplayIsActive } from '../gameplay/runState.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.input.enabled = true;
    this.physics.resume();
    this.cameras.main.setScroll(0, 0);
    this.runState = createRunState();
    this.background = new BackgroundManager(this);
    this.background.create();
    this.platforms = new PlatformManager(this);
    this.platforms.createInitialCourse();
    this.player = new Player(this, PLAYER_START_POSITION.x, PLAYER_START_POSITION.y);
    this.physics.add.collider(this.player, this.platforms.group, (player) => {
      if (player.body.touching.down && player.body.velocity.y >= 0) player.bounce();
    });

    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,D,R');
    this.touchDirection = 0;
    this.createTouchZones();
    this.ascent = new AscentTracker(this.player.y);
    this.checkpoints = new CheckpointManager(this);
    this.heightText = this.add.text(195, 28, 'HEIGHT 0', { fontSize: '22px', fontStyle: 'bold', color: '#173c36', stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(20);
    this.events.once('shutdown', () => {
      this.input.off('pointerup', this.clearTouchDirection, this);
      this.background.destroy();
      this.platforms.destroy();
      this.checkpoints.destroy();
      this.touchDirection = 0;
    });
  }

  createTouchZones() {
    const makeZone = (x, direction, label) => {
      const zone = this.add.zone(x, 724, 195, 240).setScrollFactor(0).setInteractive();
      this.add.text(x, 770, label, { fontSize: '54px', color: '#173c3677' }).setOrigin(0.5).setScrollFactor(0);
      zone.on('pointerdown', () => { this.touchDirection = direction; });
      zone.on('pointerup', () => { if (this.touchDirection === direction) this.touchDirection = 0; });
      zone.on('pointerout', (pointer) => { if (!pointer.isDown && this.touchDirection === direction) this.touchDirection = 0; });
    };
    makeZone(97.5, -1, '◀'); makeZone(292.5, 1, '▶');
    this.clearTouchDirection = () => { this.touchDirection = 0; };
    this.input.on('pointerup', this.clearTouchDirection, this);
  }

  update() {
    if (!gameplayIsActive(this.runState)) {
      if (this.runState.gameOver && Phaser.Input.Keyboard.JustDown(this.keys.R)) this.restartRun();
      return;
    }
    const keyboardDirection = (this.keys.LEFT.isDown || this.keys.A.isDown ? -1 : 0) + (this.keys.RIGHT.isDown || this.keys.D.isDown ? 1 : 0);
    this.player.move(keyboardDirection || this.touchDirection);
    this.player.updateState();
    this.player.x = wrappedHorizontalPosition(this.player.x, this.player.wrapWidth, this.scale.width);

    const desiredScroll = this.player.y - 500;
    this.runState.highestCameraY = Math.min(this.runState.highestCameraY, desiredScroll);
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, this.runState.highestCameraY, 0.08);
    const ascent = this.ascent.update(this.player.y);
    this.heightText.setText(`HEIGHT ${ascent}`);
    this.platforms.update(this.cameras.main.scrollY);
    this.background.update(this.cameras.main.scrollY);
    this.checkpoints.update(ascent, this.platforms);
    if (fellBelowCamera(this.player.y, this.cameras.main.scrollY)) this.showGameOver();
  }

  showGameOver() {
    if (!enterGameOver(this.runState)) return;
    this.touchDirection = 0;
    this.player.setVelocity(0, 0);
    this.physics.pause();
    const blocker = this.add.rectangle(195, 422, 390, 844, 0x102d2a, 0.55)
      .setScrollFactor(0).setDepth(100).setInteractive();
    this.add.rectangle(195, 422, 330, 190, 0x102d2a, 0.92).setScrollFactor(0).setDepth(101);
    this.add.text(195, 390, 'RUN OVER', { fontSize: '35px', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    const restart = this.add.text(195, 460, 'TAP TO RESTART', { fontSize: '20px', backgroundColor: '#f3b942', color: '#173c36', padding: { x: 18, y: 12 } })
      .setOrigin(0.5).setScrollFactor(0).setDepth(103).setInteractive({ useHandCursor: true });
    blocker.on('pointerdown', (pointer) => {
      if (restart.getBounds().contains(pointer.x, pointer.y)) this.restartRun();
    });
    restart.on('pointerdown', () => this.restartRun());
  }

  restartRun() {
    if (!this.runState.gameOver || this.runState.restarting) return;
    this.runState.restarting = true;
    this.touchDirection = 0;
    this.input.enabled = false;
    this.scene.restart();
  }
}
