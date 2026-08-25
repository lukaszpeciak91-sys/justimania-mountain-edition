function isLandscape() {
  return window.innerWidth > window.innerHeight || window.matchMedia?.('(orientation: landscape)').matches;
}

function setPhysicsPaused(game, paused) {
  game.scene.getScenes(true).forEach((scene) => {
    if (scene.physics?.world) paused ? scene.physics.world.pause() : scene.physics.world.resume();
    scene.input.enabled = !paused;
  });
}

export function installOrientationGuard(game) {
  const overlay = document.querySelector('#orientation-guard');
  let blocked = false;

  const update = () => {
    blocked = isLandscape();
    overlay.hidden = !blocked;
    setPhysicsPaused(game, blocked);
    game.scale.refresh();
  };

  const tryPortraitLock = async () => {
    if (!screen.orientation?.lock || !document.fullscreenElement) return;
    try { await screen.orientation.lock('portrait-primary'); } catch { /* Optional browser capability. */ }
  };

  window.addEventListener('resize', update);
  screen.orientation?.addEventListener?.('change', update);
  document.addEventListener('fullscreenchange', tryPortraitLock);
  document.addEventListener('pointerup', tryPortraitLock, { once: true });
  game.events.on('ready', update);
  requestAnimationFrame(update);

  return { update, isBlocked: () => blocked };
}
