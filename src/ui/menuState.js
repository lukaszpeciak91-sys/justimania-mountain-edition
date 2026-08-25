export const MENU_STATES = Object.freeze({
  INITIAL: 'initial',
  REVEALING: 'revealing',
  READY: 'ready',
  STARTING: 'starting',
});

export function createMenuState() {
  let state = MENU_STATES.INITIAL;

  return {
    get value() { return state; },
    beginReveal() {
      if (state !== MENU_STATES.INITIAL) return false;
      state = MENU_STATES.REVEALING;
      return true;
    },
    completeReveal() {
      if (state !== MENU_STATES.REVEALING) return false;
      state = MENU_STATES.READY;
      return true;
    },
    beginStart() {
      if (state !== MENU_STATES.READY) return false;
      state = MENU_STATES.STARTING;
      return true;
    },
  };
}
