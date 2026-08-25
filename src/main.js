import Phaser from 'phaser';
import './style.css';
import { gameConfig } from './config.js';
import { installOrientationGuard } from './ui/orientationGuard.js';
import { waitForRequiredFonts } from './ui/fontReady.js';

await waitForRequiredFonts(document.fonts);

const game = new Phaser.Game(gameConfig);
installOrientationGuard(game);
