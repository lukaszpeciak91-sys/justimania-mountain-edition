export const MENU_LAYOUT = Object.freeze({
  startYRatio: 0.5,
  startEntranceOffset: 8,
  startWidth: 190,
  startHeight: 68,
  backGap: 78,
  backWidth: 140,
  backHeight: 54,
});

export function menuControlLayout(viewportWidth, viewportHeight) {
  const x = viewportWidth / 2;
  const startY = viewportHeight * MENU_LAYOUT.startYRatio;
  return {
    start: { x, y: startY },
    back: { x, y: startY + MENU_LAYOUT.backGap },
  };
}
