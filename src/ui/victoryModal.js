export const VICTORY_REPLAY_KEY = 'justimania:replay-after-reload';

let activeListeners = [];

export function consumeVictoryReplay(storage = globalThis.sessionStorage) {
  if (!storage) return null;
  const serialized = storage.getItem(VICTORY_REPLAY_KEY);
  if (serialized !== null) storage.removeItem(VICTORY_REPLAY_KEY);
  if (!serialized) return null;
  try {
    const replay = JSON.parse(serialized);
    return replay?.autostart === true && ['mountain', 'beach'].includes(replay.editionId) ? replay : null;
  } catch {
    return null;
  }
}

export function hideVictoryModal() {
  const modal = document.getElementById('victory-modal');
  activeListeners.forEach(({ button, listener }) => button.removeEventListener('click', listener));
  activeListeners = [];
  if (modal) modal.hidden = true;
}

export function showVictoryModal(elapsedTime, editionId = 'mountain') {
  hideVictoryModal();
  const modal = document.getElementById('victory-modal');
  const title = document.getElementById('victory-title');
  const subtitle = document.getElementById('victory-subtitle');
  const time = document.getElementById('victory-time');
  const replay = document.getElementById('victory-play-again-button');
  const menu = document.getElementById('victory-menu-button');
  if (!modal || !title || !subtitle || !time || !replay || !menu) return;

  title.textContent = editionId === 'beach' ? 'COAST COMPLETED!' : 'SUMMIT REACHED!';
  subtitle.textContent = editionId === 'beach' ? 'ŚWINOUJŚCIE' : 'RYSY • 2499 m';

  let activated = false;
  const navigate = (playAgain) => {
    if (activated) return;
    activated = true;
    if (playAgain) sessionStorage.setItem(VICTORY_REPLAY_KEY, JSON.stringify({ autostart: true, editionId }));
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
