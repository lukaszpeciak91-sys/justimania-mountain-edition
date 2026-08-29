import { MENU_STATES } from './menuState.js';

export const MENU_FOREGROUND = Object.freeze({
  targetX: 212,
  bottomPadding: -32,
  targetHeight: 330,
  entranceOffset: 22,
  duration: 420,
  reducedMotionDuration: 1,
  ease: 'Quad.easeOut',
  edgePadding: 12,
  depth: 10,
  interactive: false,
  revealPhase: MENU_STATES.REVEALING,
});

export function menuForegroundLayout(sourceWidth, sourceHeight, viewportWidth, viewportHeight) {
  if (sourceWidth <= 0 || sourceHeight <= 0) return null;

  const heightScale = MENU_FOREGROUND.targetHeight / sourceHeight;
  const widthScale = (viewportWidth - MENU_FOREGROUND.edgePadding * 2) / sourceWidth;
  const scale = Math.min(heightScale, widthScale);
  const displayWidth = sourceWidth * scale;
  const halfWidth = displayWidth / 2;
  const x = Math.min(
    Math.max(MENU_FOREGROUND.targetX, MENU_FOREGROUND.edgePadding + halfWidth),
    viewportWidth - MENU_FOREGROUND.edgePadding - halfWidth,
  );

  return {
    x,
    y: viewportHeight - MENU_FOREGROUND.bottomPadding,
    scaleX: scale,
    scaleY: scale,
  };
}
