export function wrappedHorizontalPosition(x, renderedWidth, worldWidth) {
  const halfWidth = renderedWidth / 2;
  if (x + halfWidth < 0) return worldWidth + halfWidth;
  if (x - halfWidth > worldWidth) return -halfWidth;
  return x;
}

export function fellBelowCamera(playerY, cameraY, fallDistance = 920) {
  return playerY > cameraY + fallDistance;
}
