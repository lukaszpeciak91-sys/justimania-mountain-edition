export const ASSETS = Object.freeze({
  menuBackground: { key: 'menu-background', path: 'assets/backgrounds/menu-bg.webp', type: 'image' },
  gameSky: { key: 'game-sky', path: 'assets/backgrounds/game-sky.webp', type: 'image' },
  mountainsFar: { key: 'game-mountains-far', path: 'assets/backgrounds/game-mountains-far.webp', type: 'image' },
  mountainsMid: { key: 'game-mountains-mid', path: 'assets/backgrounds/game-mountains-mid.webp', type: 'image' },
  player: { key: 'justyna', path: 'assets/player/justyna-sheet.png', type: 'spritesheet' },
  platform: { key: 'platform-rock', path: 'assets/platforms/platform-rock.png', type: 'image' },
  checkpointSign: { key: 'checkpoint-sign', path: 'assets/ui/checkpoint-sign.png', type: 'image' },
});

export function textureAvailable(scene, asset) {
  return scene.textures.exists(asset.key);
}

export function reportAssetStatus(scene) {
  if (!import.meta.env.DEV) return;
  Object.values(ASSETS).forEach((asset) => {
    const status = textureAvailable(scene, asset) ? 'loaded' : 'missing; using runtime fallback';
    console[textureAvailable(scene, asset) ? 'info' : 'warn'](`[assets] ${asset.path}: ${status}`);
  });
  console.info('[assets] Black boxes or incorrect transparency originate in supplied art; binaries are never rewritten at runtime.');
}
