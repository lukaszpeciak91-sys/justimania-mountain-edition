import Phaser from 'phaser';
import './style.css';
import { gameConfig } from './config.js';
import { installOrientationGuard } from './ui/orientationGuard.js';

const game = new Phaser.Game(gameConfig);
installOrientationGuard(game);
