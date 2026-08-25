export const BOOTSTRAP_JUMP_VELOCITY = -570;
export const BOOTSTRAP_GRAVITY = 1100;
export const BOOTSTRAP_HORIZONTAL_SPEED = 205;
export const PLATFORM_GENERATION = Object.freeze({
  verticalGapMin: 105,
  verticalGapMax: 130,
  widthMin: 104,
  widthMax: 210,
  widthBands: Object.freeze([
    Object.freeze([104, 128]),
    Object.freeze([142, 168]),
    Object.freeze([184, 210]),
  ]),
  worldMargin: 24,
  horizontalSafety: 0.68,
  generateAhead: 1100,
  removeBelowCamera: 1050,
});

export function airborneTimeAtHeight(verticalGap, {
  gravity = BOOTSTRAP_GRAVITY,
  bounceVelocity = BOOTSTRAP_JUMP_VELOCITY,
} = {}) {
  const launchSpeed = Math.abs(bounceVelocity);
  const discriminant = launchSpeed ** 2 - 2 * gravity * verticalGap;
  if (discriminant <= 0) return 0;
  // The later root is when the player descends onto the target platform.
  return (launchSpeed + Math.sqrt(discriminant)) / gravity;
}

export function horizontalAllowance(verticalGap, {
  horizontalSpeed = BOOTSTRAP_HORIZONTAL_SPEED,
  safety = PLATFORM_GENERATION.horizontalSafety,
  ...flightOptions
} = {}) {
  return Math.floor(airborneTimeAtHeight(verticalGap, flightOptions) * horizontalSpeed * safety);
}

const nearlyEqual = (a, b, tolerance) => Math.abs(a - b) <= tolerance;

export function generatePlatformSpec(previous, random = Math.random, limits = PLATFORM_GENERATION) {
  const randomInt = (min, max) => Math.floor(random() * (max - min + 1)) + min;
  const gap = randomInt(limits.verticalGapMin, limits.verticalGapMax);
  const recentWidths = previous.recentWidths ?? [];
  let bands = limits.widthBands.filter(([min, max]) => recentWidths.length < 2
    || !recentWidths.slice(-2).every((width) => width >= min && width <= max));
  if (!bands.length) bands = limits.widthBands;
  const band = bands[randomInt(0, bands.length - 1)];
  const width = randomInt(band[0], band[1]);
  const minX = limits.worldMargin + width / 2;
  const maxX = 390 - limits.worldMargin - width / 2;
  const maxStep = horizontalAllowance(gap, { safety: limits.horizontalSafety });
  let step = randomInt(-maxStep, maxStep);

  // Break up metronomic left/right sequences with effectively identical spacing.
  if (previous.lastStep && Math.sign(step) === -Math.sign(previous.lastStep)
      && nearlyEqual(Math.abs(step), Math.abs(previous.lastStep), 10)) step = Math.trunc(step * 0.55);

  let x = Math.min(maxX, Math.max(minX, previous.x + step));
  // Clamping at an edge can create a vertical stack; nudge back into playable space.
  if (nearlyEqual(x, previous.x, 4)) {
    const direction = previous.x >= 195 ? -1 : 1;
    x = Math.min(maxX, Math.max(minX, x + direction * Math.min(28, maxStep)));
  }
  return { x, gap, width, step: x - previous.x, maxStep };
}
