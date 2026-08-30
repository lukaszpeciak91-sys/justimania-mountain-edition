export const MENU_STATES = Object.freeze({
  READY: 'ready',
  STARTING: 'starting',
});

export function createMenuState() {
  let state = MENU_STATES.READY;

  return {
    get value() { return state; },
    beginStart() {
      if (state !== MENU_STATES.READY) return false;
      state = MENU_STATES.STARTING;
      return true;
    },
  };
}
