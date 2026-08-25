export function createButtonPressState(onPress) {
  let enabled = false;
  let accepted = false;

  return {
    enable() {
      enabled = true;
      accepted = false;
    },
    disable() {
      enabled = false;
    },
    press() {
      if (!enabled || accepted) return false;
      accepted = true;
      onPress();
      return true;
    },
  };
}
