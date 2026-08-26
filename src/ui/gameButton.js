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
  const inputTarget = scene.add.rectangle(x, y, width, height, 0xffffff, 0)
    .setDepth(depth + 1);

  const handlePointerDown = () => {
    visual.setScale(GAME_BUTTON_STYLE.pressedScale);
    onPress();
  };
  const restoreScale = () => visual.setScale(1);
  const enable = () => {
    inputTarget.setInteractive();
    inputTarget.setScrollFactor(scrollFactor);
    inputTarget.input.cursor = 'pointer';
    return button;
  };
  const disable = () => {
    inputTarget.disableInteractive();
    restoreScale();
    return button;
  };
  const destroy = () => {
    inputTarget.destroy();
    visual.destroy();
  };
  const button = {
    visual,
    inputTarget,
    enable,
    disable,
    destroy,
    setAlpha(alpha) {
      visual.setAlpha(alpha);
      return button;
    },
  };

  inputTarget.on('pointerdown', handlePointerDown);
  inputTarget.on('pointerup', restoreScale);
  inputTarget.on('pointerout', restoreScale);

  if (interactive) enable();

  return button;
}

export function disableGameButton(button) {
  button.disable();
}
