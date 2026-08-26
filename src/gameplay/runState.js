export function createRunState() {
  return {
    gameOver: false,
    victory: false,
    victoryAction: { status: 'idle', action: null },
    highestCameraY: 0,
  };
}

export function enterGameOver(state) {
  if (state.gameOver) return false;
  state.gameOver = true;
  return true;
}

export function gameplayIsActive(state) {
  return !state.gameOver && !state.victory;
}

export function enterVictory(state, finalSummit) {
  if (state.gameOver || state.victory || !finalSummit) return false;
  state.victory = true;
  return true;
}

export function requestVictoryAction(state, action) {
  if (!state.victory || state.victoryAction.status !== 'idle') return false;
  if (action !== 'restart' && action !== 'menu') return false;
  state.victoryAction = { status: 'navigating', action };
  return true;
}
