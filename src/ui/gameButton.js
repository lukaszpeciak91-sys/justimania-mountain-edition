import Phaser from 'phaser';

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
  const button = scene.add.container(x, y, [background, text])
    .setSize(width, height)
    .setScrollFactor(scrollFactor)
    .setDepth(depth);

  button.on('pointerdown', () => {
    button.setScale(GAME_BUTTON_STYLE.pressedScale);
    onPress();
  });
  button.on('pointerup', () => button.setScale(1));
  button.on('pointerout', () => button.setScale(1));
  if (interactive) button.setInteractive({ useHandCursor: true });

  return button;
}

export function disableGameButton(button) {
  button.disableInteractive();
  button.removeAllListeners();
  button.setScale(1);
}
