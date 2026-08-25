export const BOOTSTRAP_JUMP_VELOCITY = -570;
export const BOOTSTRAP_GRAVITY = 1100;
export const BOOTSTRAP_HORIZONTAL_SPEED = 205;
export const GAMEPLAY_WIDTH = 390;

export const PLATFORM_GENERATION = Object.freeze({
  verticalGapMin: 105,
  verticalGapMax: 130,
  widthMin: 104,
  widthMax: 210,
  // Short/medium/long. Selection weights are deliberately 50/35/15 so long
  // ledges add variety without dominating the bootstrap course.
  widthBands: Object.freeze([
    Object.freeze({ name: 'short', min: 104, max: 128, weight: 0.50 }),
    Object.freeze({ name: 'medium', min: 142, max: 168, weight: 0.35 }),
    Object.freeze({ name: 'long', min: 184, max: 210, weight: 0.15 }),
  ]),
  worldMargin: 24,
  horizontalSafety: 0.68,
  generateAhead: 1100,
  removeBelowCamera: 1050,
  candidateRetries: 18,
  playerCollisionHeight: 67,
});

export const START_FLOOR_SPEC = Object.freeze({
  x: GAMEPLAY_WIDTH / 2,
  y: 790,
  width: GAMEPLAY_WIDTH,
  role: 'start-floor',
  layerId: 0,
});

export function airborneTimeAtHeight(verticalGap, {
  gravity = BOOTSTRAP_GRAVITY,
  bounceVelocity = BOOTSTRAP_JUMP_VELOCITY,
} = {}) {
  const launchSpeed = Math.abs(bounceVelocity);
  const discriminant = launchSpeed ** 2 - 2 * gravity * verticalGap;
  if (discriminant <= 0) return 0;
  return (launchSpeed + Math.sqrt(discriminant)) / gravity;
}

export function horizontalAllowance(verticalGap, {
  horizontalSpeed = BOOTSTRAP_HORIZONTAL_SPEED,
  safety = PLATFORM_GENERATION.horizontalSafety,
  ...flightOptions
} = {}) {
  return Math.floor(airborneTimeAtHeight(verticalGap, flightOptions) * horizontalSpeed * safety);
}

export function horizontalOverlap(a, b) {
  return Math.max(0, Math.min(a.x + a.width / 2, b.x + b.width / 2)
    - Math.max(a.x - a.width / 2, b.x - b.width / 2));
}

export function isWithinWorld(platform, limits = PLATFORM_GENERATION) {
  if (platform.role === 'start-floor') return platform.x === GAMEPLAY_WIDTH / 2 && platform.width === GAMEPLAY_WIDTH;
  return platform.x - platform.width / 2 >= limits.worldMargin
    && platform.x + platform.width / 2 <= GAMEPLAY_WIDTH - limits.worldMargin;
}

/** Pure, conservative ceiling check. Close long ledges may overlap only a
 * narrow fraction; short targets and larger vertical gaps receive more room.
 * The dedicated floor is exempt because its full-width geometry makes lateral
 * clearance impossible (runtime platform collision is one-way). */
export function isOverheadClear(lower, upper, profile = PLATFORM_GENERATION) {
  if (lower.role === 'start-floor') return true;
  const gap = lower.y - upper.y;
  if (gap <= 0) return true;
  const overlap = horizontalOverlap(lower, upper);
  if (!overlap) return true;
  if (gap >= 150) return true;

  const upperIsShort = upper.width <= 128;
  const bothLong = lower.width >= 184 && upper.width >= 184;
  const gapProgress = Math.max(0, Math.min(1, (gap - profile.verticalGapMin)
    / (profile.verticalGapMax - profile.verticalGapMin)));
  let allowedFraction = 0.30 + gapProgress * 0.22;
  if (upperIsShort) allowedFraction += 0.16;
  if (lower.width < 184 && upper.width >= 184) allowedFraction += 0.10;
  if (bothLong) allowedFraction -= 0.16;
  // Reserve a small additional buffer derived from the collision-body height;
  // this approximates torso clearance near the apex without coupling to art size.
  const allowedOverlap = Math.min(lower.width, upper.width) * allowedFraction
    - profile.playerCollisionHeight * 0.08;
  return overlap <= allowedOverlap;
}

export function isRouteReachable(lower, upper, limits = PLATFORM_GENERATION) {
  const gap = lower.y - upper.y;
  return gap >= limits.verticalGapMin && gap <= limits.verticalGapMax
    && Math.abs(upper.x - lower.x) <= horizontalAllowance(gap, { safety: limits.horizontalSafety })
    && isWithinWorld(upper, limits)
    && isOverheadClear(lower, upper, limits);
}

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function sampleWidth(random = Math.random, limits = PLATFORM_GENERATION) {
  const roll = random();
  let accumulated = 0;
  const band = limits.widthBands.find((entry) => {
    accumulated += entry.weight;
    return roll < accumulated;
  }) ?? limits.widthBands.at(-1);
  return { width: randomInt(random, band.min, band.max), widthClass: band.name };
}

function routeCandidate(previousRoute, layerId, random, limits) {
  const gap = randomInt(random, limits.verticalGapMin, limits.verticalGapMax);
  const { width, widthClass } = sampleWidth(random, limits);
  const maxStep = horizontalAllowance(gap, { safety: limits.horizontalSafety });
  const direction = random() < 0.5 ? -1 : 1;
  // A useful lateral move is intentional: it opens the jump corridor rather
  // than allowing almost-vertical stacks.
  const step = direction * randomInt(random, Math.floor(maxStep * 0.62), maxStep);
  return {
    x: Math.round(previousRoute.x + step),
    y: previousRoute.y - gap,
    width,
    widthClass,
    role: 'route',
    layerId,
  };
}

function clearsPreviousLayer(candidate, previousPlatforms, limits) {
  return previousPlatforms.every((lower) => isOverheadClear(lower, candidate, limits));
}

function fallbackRoute(previousRoute, previousPlatforms, layerId, limits) {
  const widths = [limits.widthBands[0].min, limits.widthBands[1].min];
  const gaps = [limits.verticalGapMax, limits.verticalGapMin];
  for (const gap of gaps) {
    const allowance = horizontalAllowance(gap, { safety: limits.horizontalSafety });
    for (const width of widths) {
      const minX = limits.worldMargin + width / 2;
      const maxX = GAMEPLAY_WIDTH - limits.worldMargin - width / 2;
      for (const direction of [previousRoute.x <= GAMEPLAY_WIDTH / 2 ? 1 : -1, previousRoute.x <= GAMEPLAY_WIDTH / 2 ? -1 : 1]) {
        for (let distance = allowance; distance >= Math.floor(allowance * 0.55); distance -= 4) {
          const candidate = {
            x: Math.round(Math.max(minX, Math.min(maxX, previousRoute.x + direction * distance))),
            y: previousRoute.y - gap,
            width,
            widthClass: width === widths[0] ? 'short' : 'medium',
            role: 'route',
            layerId,
          };
          if (isRouteReachable(previousRoute, candidate, limits)
              && clearsPreviousLayer(candidate, previousPlatforms, limits)) return candidate;
        }
      }
    }
  }
  // This is reachable only for custom/pathological limits; keeping it explicit
  // makes failure deterministic rather than permitting an unbounded loop.
  throw new Error('Unable to construct a safe fallback route platform');
}

function secondaryCandidates(route, previousRoute, layerId, random, limits) {
  const requested = random() < 0.16 ? 2 : random() < 0.58 ? 1 : 0;
  const secondaries = [];
  for (let index = 0; index < requested; index += 1) {
    const { width, widthClass } = sampleWidth(random, limits);
    const minX = limits.worldMargin + width / 2;
    const maxX = GAMEPLAY_WIDTH - limits.worldMargin - width / 2;
    const candidate = {
      x: randomInt(random, Math.ceil(minX), Math.floor(maxX)),
      y: route.y,
      width,
      widthClass,
      role: 'secondary',
      layerId,
    };
    const separated = [route, ...secondaries].every((other) => horizontalOverlap(candidate, other) === 0);
    if (separated && isWithinWorld(candidate, limits) && isOverheadClear(previousRoute, candidate, limits)) {
      secondaries.push(candidate);
    }
  }
  return secondaries;
}

export function generatePlatformLayer(previousLayerOrRoute, layerId, random = Math.random, limits = PLATFORM_GENERATION) {
  const previousRoute = previousLayerOrRoute.route ?? previousLayerOrRoute;
  const previousPlatforms = previousLayerOrRoute.platforms ?? [previousRoute];
  let route;
  let attempts = 0;
  while (attempts < limits.candidateRetries) {
    attempts += 1;
    const candidate = routeCandidate(previousRoute, layerId, random, limits);
    if (isRouteReachable(previousRoute, candidate, limits)
        && clearsPreviousLayer(candidate, previousPlatforms, limits)) {
      route = candidate;
      break;
    }
  }
  const usedFallback = !route;
  route ??= fallbackRoute(previousRoute, previousPlatforms, layerId, limits);
  return {
    id: layerId,
    route,
    platforms: [route, ...secondaryCandidates(route, previousRoute, layerId, random, limits)],
    attempts,
    usedFallback,
  };
}
