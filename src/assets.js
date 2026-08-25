export const ASSETS = Object.freeze({
  menuBackground: { key: 'menu-background', path: 'assets/backgrounds/menu-bg.webp', type: 'image' },
  gameSky: { key: 'game-sky', path: 'assets/backgrounds/game-sky.webp', type: 'image' },
  mountainsFar: { key: 'game-mountains-far', path: 'assets/backgrounds/game-mountains-far.webp', type: 'image' },
  mountainsMid: { key: 'game-mountains-mid', path: 'assets/backgrounds/game-mountains-mid.webp', type: 'image' },
  player: { key: 'justyna', path: 'assets/player/justyna-sheet.png', type: 'spritesheet' },
  platform: { key: 'platform-rock', path: 'assets/platforms/platform-rock.png', type: 'image' },
  checkpointSign: { key: 'checkpoint-sign', path: 'assets/ui/checkpoint-sign.png', type: 'image' },
  kaya: { key: 'kaya-the-dog', path: 'assets/ui/kaya-the-dog.png', type: 'image' },
  gameTheme: { key: 'game-theme', path: 'assets/audio/game-theme.mp3', type: 'audio' },
});

export function textureAvailable(scene, asset) {
  return scene.textures.exists(asset.key);
}

export function assetAvailable(scene, asset) {
  if (asset.type === 'audio') return scene.cache.audio.exists(asset.key);
  return textureAvailable(scene, asset);
}

export function reportAssetStatus(scene) {
  if (!import.meta.env.DEV) return;
  Object.values(ASSETS).forEach((asset) => {
    const available = assetAvailable(scene, asset);
    const status = available ? 'loaded' : 'missing; using runtime fallback';
    console[available ? 'info' : 'warn'](`[assets] ${asset.path}: ${status}`);
  });
  console.info('[assets] Black boxes or incorrect transparency originate in supplied art; binaries are never rewritten at runtime.');
}
