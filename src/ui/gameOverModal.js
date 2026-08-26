let activeMenuListener = null;

export function hideGameOverModal() {
  const modal = document.getElementById('game-over-modal');
  const button = document.getElementById('game-over-menu-button');
  if (activeMenuListener) button?.removeEventListener('click', activeMenuListener);
  activeMenuListener = null;
  if (modal) modal.hidden = true;
}

export function showGameOverModal() {
  hideGameOverModal();
  const modal = document.getElementById('game-over-modal');
  const button = document.getElementById('game-over-menu-button');
  if (!modal || !button) return;

  let activated = false;
  activeMenuListener = () => {
    if (activated) return;
    activated = true;
    window.location.reload();
  };
  button.addEventListener('click', activeMenuListener);
  modal.hidden = false;
}
