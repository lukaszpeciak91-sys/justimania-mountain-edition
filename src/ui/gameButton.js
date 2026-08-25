import { createButtonPressState } from './gameButtonState.js';

export const GAME_BUTTON_STYLE = Object.freeze({
  fillColor: 0x173c36,
  borderColor: 0xe85f50,
  borderWidth: 3,
  cornerRadius: 12,
  labelColor: '#fff1d0',
  fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif',
  pressedScale: 0.97,
});

export function createGameButton(scene, {
  x,
  y,
  label,
  width,
  height,
  fontSize,
  onPress,
  interactive = true,
  depth = 0,
  scrollFactor = 0,
}) {
  const background = scene.add.graphics()
    .fillStyle(GAME_BUTTON_STYLE.fillColor)
    .fillRoundedRect(-width / 2, -height / 2, width, height, GAME_BUTTON_STYLE.cornerRadius)
    .lineStyle(GAME_BUTTON_STYLE.borderWidth, GAME_BUTTON_STYLE.borderColor)
    .strokeRoundedRect(-width / 2, -height / 2, width, height, GAME_BUTTON_STYLE.cornerRadius);
  const text = scene.add.text(0, 0, label, {
    fontFamily: GAME_BUTTON_STYLE.fontFamily,
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    letterSpacing: 2,
    color: GAME_BUTTON_STYLE.labelColor,
  }).setOrigin(0.5);
  const visual = scene.add.container(x, y, [background, text])
    .setScrollFactor(scrollFactor)
    .setDepth(depth);
  const hitTarget = scene.add.zone(x, y, width, height)
    .setScrollFactor(scrollFactor)
    .setDepth(depth + 1);
  const pressState = createButtonPressState(onPress);

  const handlePointerDown = () => {
    visual.setScale(GAME_BUTTON_STYLE.pressedScale);
    pressState.press();
  };
  const restoreScale = () => visual.setScale(1);
  const enable = () => {
    pressState.enable();
    hitTarget.removeAllListeners();
    // Let Phaser keep the hit area aligned with the Zone's size and origin.
    hitTarget.setInteractive();
    hitTarget.input.cursor = 'pointer';
    hitTarget.on('pointerdown', handlePointerDown);
    hitTarget.on('pointerup', restoreScale);
    hitTarget.on('pointerout', restoreScale);
    return button;
  };
  const disable = () => {
    pressState.disable();
    hitTarget.disableInteractive();
    hitTarget.removeAllListeners();
    restoreScale();
    return button;
  };
  const destroy = () => {
    disable();
    hitTarget.destroy();
    visual.destroy();
  };
  const button = {
    visual,
    hitTarget,
    enable,
    disable,
    destroy,
    setAlpha(alpha) {
      visual.setAlpha(alpha);
      return button;
    },
  };

  if (interactive) enable();

  return button;
}

export function disableGameButton(button) {
  button.disable();
}
