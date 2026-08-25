export function createRunState() {
  return {
    gameOver: false,
    gameOverAction: { status: 'idle', action: null },
    highestCameraY: 0,
  };
}

export function enterGameOver(state) {
  if (state.gameOver) return false;
  state.gameOver = true;
  return true;
}

export function gameplayIsActive(state) {
  return !state.gameOver;
}

export function requestGameOverAction(state, action) {
  if (!state.gameOver || state.gameOverAction.status !== 'idle') return false;
  if (action !== 'restart' && action !== 'menu') return false;
  state.gameOverAction = { status: 'navigating', action };
  return true;
}
