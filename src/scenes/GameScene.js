import Phaser from 'phaser';
import Player from '../gameplay/Player.js';
import { PLAYER_START_POSITION } from '../gameplay/playerProfile.js';
import PlatformManager from '../gameplay/PlatformManager.js';
import BackgroundManager from '../gameplay/BackgroundManager.js';
import AscentTracker from '../gameplay/AscentTracker.js';
import CheckpointManager from '../gameplay/CheckpointManager.js';
import { normalizedHeight } from '../gameplay/heightNormalization.js';
import { FINAL_WORLD_ASCENT } from '../gameplay/difficulty.js';
import { CHECKPOINTS_BY_EDITION } from '../gameplay/checkpointData.js';
import { formatRunTime } from '../gameplay/runTime.js';
import { VICTORY_TIMING } from '../gameplay/victorySequence.js';
import { fellBelowCamera, wrappedHorizontalPosition } from '../gameplay/worldWrap.js';
import {
  createRunState,
  enterGameOver,
  gameplayIsActive,
  enterVictory,
} from '../gameplay/runState.js';
import { ASSETS, assetAvailable } from '../assets.js';
import GameplayMusic from '../gameplay/GameplayMusic.js';
import { hideGameOverModal, showGameOverModal } from '../ui/gameOverModal.js';
import { hideVictoryModal, showVictoryModal } from '../ui/victoryModal.js';
import { selectEdition, selectedEdition } from '../config/editionState.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.edition = data?.editionId
      ? selectEdition(this.registry, data.editionId)
      : selectedEdition(this.registry);
  }

  create() {
    this.input.enabled = true;
    this.physics.resume();
    this.cameras.main.setScroll(0, 0);
    this.runState = createRunState();
    this.touchZones = [];
    this.victoryObjects = [];
    this.gameplayMusic = new GameplayMusic({
      soundManager: this.sound,
      input: this.input,
      key: ASSETS.gameTheme.key,
      available: assetAvailable(this, ASSETS.gameTheme),
    });
    this.gameplayMusic.start();
    this.loadGameplayMusic();
    this.background = new BackgroundManager(this, this.edition.gameplay);
    this.background.create();
    this.checkpoints = new CheckpointManager(
      this,
      CHECKPOINTS_BY_EDITION[this.edition.checkpoints],
      this.edition.id,
      this.edition.presentation,
    );
    this.platforms = new PlatformManager(this, this.checkpoints, this.edition.gameplay);
    this.platforms.createInitialCourse();
    this.player = new Player(this, PLAYER_START_POSITION.x, PLAYER_START_POSITION.y,
      this.edition.gameplay.player, this.edition.gameplay.playerFallback);
    this.physics.add.collider(this.player, this.platforms.group, (player, platform) => {
      if (!player.body.touching.down || player.body.velocity.y < 0) return;
      const checkpoint = this.checkpoints.reachPlatform(platform);
      if (checkpoint?.finalSummit) this.reachSummit(platform);
      else player.bounce();
    });

    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,D,R');
    this.touchDirection = 0;
    this.createTouchZones();
    this.ascent = new AscentTracker(this.player.y);
    this.runStartedAt = this.time.now;
    this.runElapsedMs = 0;
    this.lastHudHeight = 0;
    this.lastHudSecond = 0;
    this.hudText = this.add.text(this.scale.width / 2, 28, this.formatHud(0, 0), { fontSize: '22px', fontStyle: 'bold', color: '#173c36', stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(20);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanUp, this);
  }

  loadGameplayMusic() {
    if (assetAvailable(this, ASSETS.gameTheme)) return;
    this.gameplayMusicLoaded = () => {
      this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.gameplayMusicLoadFailed);
      this.gameplayMusic?.makeAvailable();
    };
    this.gameplayMusicLoadFailed = (file) => {
      if (file?.key !== ASSETS.gameTheme.key) return;
      this.load.off(`filecomplete-audio-${ASSETS.gameTheme.key}`, this.gameplayMusicLoaded);
    };
    this.load.once(`filecomplete-audio-${ASSETS.gameTheme.key}`, this.gameplayMusicLoaded);
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, this.gameplayMusicLoadFailed);
    this.load.audio(ASSETS.gameTheme.key, ASSETS.gameTheme.path);
    this.load.start();
  }

  createTouchZones() {
    const makeZone = (x, direction, label) => {
      const zone = this.add.zone(x, 724, 195, 240).setScrollFactor(0).setInteractive();
      this.add.text(x, 770, label, { fontSize: '54px', color: '#173c3677' }).setOrigin(0.5).setScrollFactor(0);
      zone.on('pointerdown', () => {
        if (gameplayIsActive(this.runState)) this.touchDirection = direction;
      });
      zone.on('pointerup', () => { if (this.touchDirection === direction) this.touchDirection = 0; });
      zone.on('pointerout', (pointer) => { if (!pointer.isDown && this.touchDirection === direction) this.touchDirection = 0; });
      this.touchZones.push(zone);
    };
    makeZone(97.5, -1, '◀'); makeZone(292.5, 1, '▶');
    this.clearTouchDirection = () => { this.touchDirection = 0; };
    this.input.on('pointerup', this.clearTouchDirection, this);
  }

  update() {
    if (!gameplayIsActive(this.runState)) {
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
    this.updateHud(ascent);
    this.checkpoints.markPassed(this.player.y);
    this.platforms.update(this.cameras.main.scrollY);
    this.background.update(this.cameras.main.scrollY);
    if (fellBelowCamera(this.player.y, this.cameras.main.scrollY)) this.showGameOver();
  }

  reachSummit(platform) {
    if (!enterVictory(this.runState, platform.finalSummit)) return;
    if (this.edition.id === 'beach') this.updateHud(FINAL_WORLD_ASCENT, this.time.now);
    this.freezeRunTimer();
    this.touchDirection = 0;
    this.disableTouchZones();
    this.player.setVelocity(0, 0).setAcceleration(0, 0);
    this.player.body.setAllowGravity(false);
    if (this.player.hasArt) this.player.setFrame(0);
    this.time.delayedCall(VICTORY_TIMING.summitViewMs, () => {
      if (this.runState.victory) this.showSummitCelebration();
    });
    this.time.delayedCall(VICTORY_TIMING.popupDelayMs, () => {
      if (this.runState.victory) this.showVictoryPopup();
    });
  }

  showSummitCelebration() {
    const colors = [0xffd45c, 0xf0798d, 0x75cbb5, 0xffffff];
    for (let index = 0; index < 28; index += 1) {
      const piece = this.add.rectangle(Phaser.Math.Between(25, 365), Phaser.Math.Between(100, 300), 5, 10, colors[index % colors.length])
        .setScrollFactor(0).setDepth(98).setAngle(Phaser.Math.Between(-45, 45));
      this.tweens.add({ targets: piece, y: piece.y + Phaser.Math.Between(160, 320), angle: piece.angle + 180, alpha: 0, duration: Phaser.Math.Between(1100, VICTORY_TIMING.celebrationMs), onComplete: () => piece.destroy() });
      this.victoryObjects.push(piece);
    }
  }

  showVictoryPopup() {
    showVictoryModal(formatRunTime(this.runElapsedMs), this.edition.id);
  }

  showGameOver() {
    if (!enterGameOver(this.runState)) return;
    this.freezeRunTimer();
    this.touchDirection = 0;
    this.disableTouchZones();
    this.player.setVelocity(0, 0);
    this.player.setAcceleration(0, 0);
    this.player.body.setAllowGravity(false);
    showGameOverModal();
  }

  cleanUp() {
    hideGameOverModal();
    hideVictoryModal();
    this.gameplayMusic?.destroy();
    this.gameplayMusic = null;
    this.load.off(`filecomplete-audio-${ASSETS.gameTheme.key}`, this.gameplayMusicLoaded);
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.gameplayMusicLoadFailed);
    this.input.off('pointerup', this.clearTouchDirection, this);
    this.touchZones?.forEach((zone) => {
      zone.disableInteractive();
      zone.removeAllListeners();
      zone.destroy();
    });
    this.victoryObjects?.forEach((object) => object.destroy());
    this.background?.destroy();
    this.platforms?.destroy();
    this.checkpoints?.destroy();
    this.touchDirection = 0;
    this.touchZones = [];
    this.gameplayMusicLoaded = null;
    this.gameplayMusicLoadFailed = null;
    this.victoryObjects = [];
  }

  disableTouchZones() {
    this.touchZones?.forEach((zone) => zone.disableInteractive());
  }

  formatHud(ascent, elapsedMs) {
    const metric = this.edition.id === 'beach'
      ? `PROGRESS ${Math.min(100, Math.floor(ascent / FINAL_WORLD_ASCENT * 100))}%`
      : `HEIGHT ${normalizedHeight(ascent)} m`;
    return `${metric}  •  TIME ${formatRunTime(elapsedMs)}`;
  }

  updateHud(ascent = this.lastHudHeight, now = this.time.now) {
    this.runElapsedMs = Math.max(0, now - this.runStartedAt);
    const visibleSecond = Math.floor(this.runElapsedMs / 1000);
    if (ascent === this.lastHudHeight && visibleSecond === this.lastHudSecond) return;
    this.lastHudHeight = ascent;
    this.lastHudSecond = visibleSecond;
    this.hudText.setText(this.formatHud(ascent, this.runElapsedMs));
  }

  freezeRunTimer() {
    this.updateHud(this.lastHudHeight, this.time.now);
  }
}
