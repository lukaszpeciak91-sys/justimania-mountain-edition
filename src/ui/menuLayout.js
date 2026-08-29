const MENU_BUTTON_SIZE = Object.freeze({
  width: 190,
  height: 68,
});

export const MENU_LAYOUT = Object.freeze({
  startYRatio: 0.5,
  startEntranceOffset: 8,
  startWidth: MENU_BUTTON_SIZE.width,
  startHeight: MENU_BUTTON_SIZE.height,
  backGap: 78,
  backWidth: MENU_BUTTON_SIZE.width,
  backHeight: MENU_BUTTON_SIZE.height,
});

export function menuControlLayout(viewportWidth, viewportHeight) {
  const x = viewportWidth / 2;
  const startY = viewportHeight * MENU_LAYOUT.startYRatio;
  return {
    start: { x, y: startY },
    back: { x, y: startY + MENU_LAYOUT.backGap },
  };
}
