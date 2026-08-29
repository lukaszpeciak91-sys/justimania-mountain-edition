export const ASSETS = Object.freeze({
  menuBackground: { key: 'menu-background', path: 'assets/backgrounds/menu-bg.webp', type: 'image' },
  menuForeground: { key: 'menu-justyna-kaya', path: 'assets/ui/menu-justyna-kaya.png', type: 'image' },
  gameSky: { key: 'game-sky', path: 'assets/backgrounds/game-sky.webp', type: 'image' },
  mountainsFar: { key: 'game-mountains-far', path: 'assets/backgrounds/game-mountains-far.webp', type: 'image' },
  mountainsMid: { key: 'game-mountains-mid', path: 'assets/backgrounds/game-mountains-mid.webp', type: 'image' },
  player: { key: 'justyna', path: 'assets/player/justyna-sheet.png', type: 'spritesheet' },
  platform: { key: 'platform-rock', path: 'assets/platforms/platform-rock.png', type: 'image' },
  checkpointSign: { key: 'checkpoint-sign', path: 'assets/ui/checkpoint-sign.png', type: 'image' },
  kaya: { key: 'kaya-the-dog', path: 'assets/ui/kaya-the-dog.png', type: 'image' },
  gameTheme: { key: 'game-theme', path: 'assets/audio/game-theme.mp3', type: 'audio' },
  beachMenuBackground: { key: 'menu-beach-background', path: 'assets/backgrounds/menu-beach-bg.webp', type: 'image', optional: true },
  beachMenuForeground: { key: 'menu-beach-justyna-kaya', path: 'assets/ui/menu-beach-justyna-kaya.png', type: 'image', optional: true },
  beachFar: { key: 'game-beach-far', path: 'assets/backgrounds/game-beach-far.webp', type: 'image', optional: true },
  beachMid: { key: 'game-beach-mid', path: 'assets/backgrounds/game-beach-mid.webp', type: 'image', optional: true },
  beachPlayer: { key: 'justyna-beach', path: 'assets/player/justyna-beach-sheet.png', type: 'spritesheet', optional: true },
  beachPlatform: { key: 'platform-beach-sand', path: 'assets/platforms/platform-beach-sand.png', type: 'image', optional: true },
});

// The selector is entirely source-generated, so it has no blocking binary assets.
export const BOOT_ASSETS = Object.freeze([]);

export const SHARED_GAMEPLAY_ASSETS = Object.freeze([
  ASSETS.gameSky,
  ASSETS.checkpointSign,
  ASSETS.kaya,
]);

export const MOUNTAIN_ASSETS = Object.freeze([
  ASSETS.menuBackground,
  ASSETS.menuForeground,
  ...SHARED_GAMEPLAY_ASSETS,
  ASSETS.mountainsFar,
  ASSETS.mountainsMid,
  ASSETS.player,
  ASSETS.platform,
]);

export const BEACH_ASSETS = Object.freeze([
  ASSETS.beachMenuBackground,
  ASSETS.beachMenuForeground,
  ...SHARED_GAMEPLAY_ASSETS,
  ASSETS.beachFar,
  ASSETS.beachMid,
  ASSETS.beachPlayer,
  ASSETS.beachPlatform,
]);

export const EDITION_ASSETS = Object.freeze({
  mountain: MOUNTAIN_ASSETS,
  beach: BEACH_ASSETS,
});

export function assetsForEdition(editionId) {
  return EDITION_ASSETS[editionId] ?? MOUNTAIN_ASSETS;
}

export function textureAvailable(scene, asset) {
  return Boolean(asset && scene.textures.exists(asset.key));
}

export function assetAvailable(scene, asset) {
  if (asset.type === 'audio') return scene.cache.audio.exists(asset.key);
  return textureAvailable(scene, asset);
}

export function enqueueMissingAssets(scene, assets) {
  const missing = assets.filter((asset) => !assetAvailable(scene, asset));
  missing.forEach((asset) => {
    if (asset.type === 'spritesheet') {
      scene.load.spritesheet(asset.key, asset.path, { frameWidth: 768, frameHeight: 768 });
    } else if (asset.type === 'image') {
      scene.load.image(asset.key, asset.path);
    }
  });
  return missing;
}

export function ensureAssetsLoaded(scene, assets) {
  const missing = enqueueMissingAssets(scene, assets);
  if (missing.length === 0) return Promise.resolve();

  return new Promise((resolve) => {
    const onError = (file) => {
      const asset = missing.find(({ key }) => key === file.key);
      if (import.meta.env?.DEV) {
        const fallback = asset?.optional ? 'optional fallback will be used' : 'runtime fallback will be used';
        console.warn(`[assets] Failed to load ${file.src}; ${fallback}.`);
      }
    };
    scene.load.on('loaderror', onError);
    scene.load.once('complete', () => {
      scene.load.off('loaderror', onError);
      resolve();
    });
    scene.load.start();
  });
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
