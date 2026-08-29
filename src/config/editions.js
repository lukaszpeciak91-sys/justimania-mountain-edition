import { ASSETS } from '../assets.js';

export const EDITION_IDS = Object.freeze(['mountain', 'beach']);

export const EDITIONS = Object.freeze({
  mountain: Object.freeze({
    id: 'mountain',
    label: 'MOUNTAIN EDITION',
    menuBackground: ASSETS.menuBackground,
    menuForeground: ASSETS.menuForeground,
    checkpoints: 'mountain',
    gameplay: Object.freeze({
      player: ASSETS.player,
      sky: ASSETS.gameSky,
      far: ASSETS.mountainsFar,
      mid: ASSETS.mountainsMid,
      platform: ASSETS.platform,
    }),
  }),
  beach: Object.freeze({
    id: 'beach',
    label: 'BEACH EDITION',
    menuBackground: ASSETS.beachMenuBackground,
    menuForeground: ASSETS.beachMenuForeground,
    checkpoints: 'beach',
    gameplay: Object.freeze({
      player: ASSETS.beachPlayer,
      playerFallback: ASSETS.player,
      sky: ASSETS.gameSky,
      far: ASSETS.beachFar,
      mid: ASSETS.beachMid,
      platform: ASSETS.beachPlatform,
      platformFallback: ASSETS.platform,
    }),
  }),
});

export function getEdition(id) {
  return EDITIONS[id] ?? EDITIONS.mountain;
}
