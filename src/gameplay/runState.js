export function createRunState() {
  return {
    gameOver: false,
    restarting: false,
    highestCameraY: 0,
  };
}

export function enterGameOver(state) {
  if (state.gameOver) return false;
  state.gameOver = true;
  return true;
}

export function gameplayIsActive(state) {
  return !state.gameOver && !state.restarting;
}
