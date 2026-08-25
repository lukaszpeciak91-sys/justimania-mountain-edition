import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import { BOOTSTRAP_GRAVITY } from './gameplay/difficulty.js';

export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#b9e4e8',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: BOOTSTRAP_GRAVITY }, debug: false },
  },
  input: { activePointers: 3 },
  scene: [BootScene, MenuScene, GameScene],
};
