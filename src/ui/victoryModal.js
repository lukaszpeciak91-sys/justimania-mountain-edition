export const VICTORY_AUTOSTART_KEY = 'justimania:start-game-after-reload';

let activeListeners = [];

export function consumeVictoryAutostart(storage = globalThis.sessionStorage) {
  if (!storage) return false;
  const shouldStart = storage.getItem(VICTORY_AUTOSTART_KEY) === '1';
  if (shouldStart) storage.removeItem(VICTORY_AUTOSTART_KEY);
  return shouldStart;
}

export function hideVictoryModal() {
  const modal = document.getElementById('victory-modal');
  activeListeners.forEach(({ button, listener }) => button.removeEventListener('click', listener));
  activeListeners = [];
  if (modal) modal.hidden = true;
}

export function showVictoryModal(elapsedTime) {
  hideVictoryModal();
  const modal = document.getElementById('victory-modal');
  const time = document.getElementById('victory-time');
  const replay = document.getElementById('victory-play-again-button');
  const menu = document.getElementById('victory-menu-button');
  if (!modal || !time || !replay || !menu) return;

  let activated = false;
  const navigate = (playAgain) => {
    if (activated) return;
    activated = true;
    if (playAgain) sessionStorage.setItem(VICTORY_AUTOSTART_KEY, '1');
    window.location.reload();
  };
  const replayListener = () => navigate(true);
  const menuListener = () => navigate(false);
  replay.addEventListener('click', replayListener);
  menu.addEventListener('click', menuListener);
  activeListeners = [
    { button: replay, listener: replayListener },
    { button: menu, listener: menuListener },
  ];
  time.textContent = `TIME ${elapsedTime}`;
  modal.hidden = false;
}
