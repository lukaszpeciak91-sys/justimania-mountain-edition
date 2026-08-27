export const BOOTSTRAP_JUMP_VELOCITY = -570;
export const BOOTSTRAP_GRAVITY = 1100;
export const BOOTSTRAP_HORIZONTAL_SPEED = 205;
export const GAMEPLAY_WIDTH = 390;
export const FINAL_WORLD_ASCENT = 70000;

const band = (id, endProgress, widthWeights, horizontalStepRange, secondaryChances, maxPreferredOverlap, maxStationaryCorridor, maxPassiveChain) => Object.freeze({
  id, endProgress, widthWeights: Object.freeze(widthWeights),
  horizontalStepRange: Object.freeze(horizontalStepRange),
  secondaryChances: Object.freeze(secondaryChances),
  maxPreferredOverlap,
  maxStationaryCorridor,
  maxPassiveChain,
});

export const DIFFICULTY_BANDS = Object.freeze([
  band('intro', 0.25, { short: 0.20, medium: 0.45, long: 0.35 }, [0.62, 0.94], [0.30, 0.48], 0.90, 150, 2),
  band('climb', 0.50, { short: 0.50, medium: 0.35, long: 0.15 }, [0.58, 0.88], [0.16, 0.42], 0.58, 105, 1),
  band('high-mountains', 0.75, { short: 0.58, medium: 0.34, long: 0.08 }, [0.68, 0.94], [0.08, 0.27], 0.55, 95, 1),
  band('summit-push', 1, { short: 0.68, medium: 0.28, long: 0.04 }, [0.76, 0.96], [0.04, 0.16], 0.50, 90, 1),
]);

export function difficultyBandAt(ascent, finalAscent = FINAL_WORLD_ASCENT) {
  const progress = Math.max(0, ascent) / finalAscent;
  return DIFFICULTY_BANDS.find(({ endProgress }) => progress < endProgress) ?? DIFFICULTY_BANDS.at(-1);
}

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
  // Ordinary ledges may be clipped slightly so their centers can use more of
  // the playfield. Checkpoint routes continue to use worldMargin separately.
  edgeOverhang: 24,
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

export function routeOverlapRatio(lower, upper) {
  const smallerWidth = Math.min(lower.width, upper.width);
  return smallerWidth > 0 ? horizontalOverlap(lower, upper) / smallerWidth : 0;
}

export function stationaryLandingCorridorWidth(lower, upper, playerWidth = PLAYER_COLLISION_WORLD_WIDTH) {
  const playerHalfWidth = playerWidth / 2;
  const lowerLeft = lower.x - lower.width / 2 - playerHalfWidth;
  const lowerRight = lower.x + lower.width / 2 + playerHalfWidth;
  const upperLeft = upper.x - upper.width / 2 - playerHalfWidth;
  const upperRight = upper.x + upper.width / 2 + playerHalfWidth;
  return Math.max(0, Math.min(lowerRight, upperRight) - Math.max(lowerLeft, upperLeft));
}

export function isPassiveTransition(lower, upper) {
  // A grazing shared center is technically landable but is not a reliable
  // zero-input ladder. A meaningful passive corridor must accommodate the
  // collider plus generous landing tolerance on both sides.
  return stationaryLandingCorridorWidth(lower, upper) >= PLAYER_COLLISION_WORLD_WIDTH * 2.65;
}

export function landablePassiveDepth(previousPlatforms, candidate) {
  return previousPlatforms.reduce((depth, lower) => (
    isPassiveTransition(lower, candidate) ? Math.max(depth, (lower.passiveDepth ?? 0) + 1) : depth
  ), 0);
}

export function passiveChainLength(history, lower, upper) {
  if (!isPassiveTransition(lower, upper)) return 0;
  let length = 1;
  for (let index = history.length - 1; index >= 0 && history[index].passive; index -= 1) length += 1;
  return length;
}

export function directionHistoryAccepts(history, direction) {
  const recent = history.slice(-3).map((entry) => entry.direction).filter(Boolean);
  if (recent.length < 3) return true;
  if (recent.every((value) => value === direction)) return false;
  const alternating = recent[0] !== recent[1] && recent[1] !== recent[2];
  return !alternating || direction === recent[2];
}

export function isWithinWorld(platform, limits = PLATFORM_GENERATION) {
  if (platform.role === 'start-floor') return platform.x === GAMEPLAY_WIDTH / 2 && platform.width === GAMEPLAY_WIDTH;
  return platform.x - platform.width / 2 >= -limits.edgeOverhang
    && platform.x + platform.width / 2 <= GAMEPLAY_WIDTH + limits.edgeOverhang;
}

export function visiblePlatformWidth(platform, worldWidth = GAMEPLAY_WIDTH) {
  const left = Math.max(0, platform.x - platform.width / 2);
  const right = Math.min(worldWidth, platform.x + platform.width / 2);
  return Math.max(0, right - left);
}

export function isMostlyVisible(platform, worldWidth = GAMEPLAY_WIDTH) {
  return visiblePlatformWidth(platform, worldWidth) > platform.width / 2;
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

export function sampleWidth(random = Math.random, limits = PLATFORM_GENERATION, difficulty = null) {
  const roll = random();
  let accumulated = 0;
  const band = limits.widthBands.find((entry) => {
    accumulated += difficulty?.widthWeights[entry.name] ?? entry.weight;
    return roll < accumulated;
  }) ?? limits.widthBands.at(-1);
  return { width: randomInt(random, band.min, band.max), widthClass: band.name };
}

function routeCandidate(previousRoute, layerId, random, limits, difficulty, forceShort = false) {
  const gap = randomInt(random, limits.verticalGapMin, limits.verticalGapMax);
  const { width, widthClass } = forceShort
    ? { width: randomInt(random, limits.widthBands[0].min, limits.widthBands[0].max), widthClass: 'short' }
    : sampleWidth(random, limits, difficulty);
  const maxStep = horizontalAllowance(gap, { safety: limits.horizontalSafety });
  const direction = random() < 0.5 ? -1 : 1;
  // A useful lateral move is intentional: it opens the jump corridor rather
  // than allowing almost-vertical stacks.
  const [stepMin, stepMax] = difficulty.horizontalStepRange;
  const step = direction * randomInt(random, Math.floor(maxStep * stepMin), Math.floor(maxStep * stepMax));
  return {
    x: Math.round(previousRoute.x + step),
    y: previousRoute.y - gap,
    width,
    widthClass,
    role: 'route',
    layerId,
  };
}

export function routeTransitionRecord(lower, upper) {
  return Object.freeze({
    direction: Math.sign(upper.x - lower.x),
    overlapRatio: routeOverlapRatio(lower, upper),
    stationaryCorridor: stationaryLandingCorridorWidth(lower, upper),
    passive: isPassiveTransition(lower, upper),
    widthClass: upper.widthClass,
  });
}

function meetsRouteQuality(previousRoute, previousPlatforms, candidate, history, difficulty, stage) {
  const transition = routeTransitionRecord(previousRoute, candidate);
  if (landablePassiveDepth(previousPlatforms, candidate) > difficulty.maxPassiveChain) return false;
  if (stage < 2 && transition.overlapRatio > difficulty.maxPreferredOverlap) return false;
  if (stage < 2 && transition.stationaryCorridor > difficulty.maxStationaryCorridor) return false;
  if (stage === 2 && transition.overlapRatio > Math.min(1, difficulty.maxPreferredOverlap + 0.15)) return false;
  return stage > 0 || directionHistoryAccepts(history, transition.direction);
}

function clearsPreviousLayer(candidate, previousPlatforms, limits) {
  return previousPlatforms.every((lower) => isOverheadClear(lower, candidate, limits));
}

function fallbackRoute(previousRoute, previousPlatforms, layerId, limits, exclusionZones = [], difficulty = null) {
  const widths = [limits.widthBands[0].min, limits.widthBands[1].min];
  const gaps = Array.from(
    { length: limits.verticalGapMax - limits.verticalGapMin + 1 },
    (_, index) => limits.verticalGapMax - index,
  );
  let safeFallback = null;
  for (const gap of gaps) {
    const allowance = horizontalAllowance(gap, { safety: limits.horizontalSafety });
    for (const width of widths) {
      const minX = -limits.edgeOverhang + width / 2;
      const maxX = GAMEPLAY_WIDTH + limits.edgeOverhang - width / 2;
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
              && clearsPreviousLayer(candidate, previousPlatforms, limits)
              && clearsExclusions(candidate, exclusionZones)) {
            safeFallback ??= candidate;
            if (!difficulty || landablePassiveDepth(previousPlatforms, candidate) <= difficulty.maxPassiveChain) return candidate;
          }
        }
      }
    }
  }
  if (safeFallback) return safeFallback;
  // This is reachable only for custom/pathological limits; keeping it explicit
  // makes failure deterministic rather than permitting an unbounded loop.
  throw new Error('Unable to construct a safe fallback route platform');
}

function intersectsExclusion(platform, zone) {
  const halfHeight = 57 / 2;
  return platform.x + platform.width / 2 > zone.left && platform.x - platform.width / 2 < zone.right
    && platform.y + halfHeight > zone.top && platform.y - halfHeight < zone.bottom;
}

function clearsExclusions(platform, zones) {
  return zones.every((zone) => !intersectsExclusion(platform, zone));
}

export function secondaryCandidateIsSafe(candidate, previousPlatforms, difficulty) {
  return landablePassiveDepth(previousPlatforms, candidate) <= difficulty.maxPassiveChain;
}

function secondaryCandidates(route, previousPlatforms, layerId, random, limits, difficulty, exclusionZones) {
  const [twoChance, anyChance] = difficulty.secondaryChances;
  const requested = random() < twoChance ? 2 : random() < anyChance ? 1 : 0;
  const secondaries = [];
  for (let index = 0; index < requested; index += 1) {
    const { width, widthClass } = sampleWidth(random, limits, difficulty);
    const minX = -limits.edgeOverhang + width / 2;
    const maxX = GAMEPLAY_WIDTH + limits.edgeOverhang - width / 2;
    const candidate = {
      x: randomInt(random, Math.ceil(minX), Math.floor(maxX)),
      y: route.y,
      width,
      widthClass,
      role: 'secondary',
      layerId,
    };
    const separated = [route, ...secondaries].every((other) => horizontalOverlap(candidate, other) === 0);
    const clearsPreviousLayer = previousPlatforms.every((lower) => (
      isOverheadClear(lower, candidate, limits)
    ));
    candidate.passiveDepth = landablePassiveDepth(previousPlatforms, candidate);
    if (separated && isWithinWorld(candidate, limits) && clearsPreviousLayer
        && clearsExclusions(candidate, exclusionZones) && secondaryCandidateIsSafe(candidate, previousPlatforms, difficulty)) {
      secondaries.push(candidate);
    }
  }
  return secondaries;
}

export function generatePlatformLayer(previousLayerOrRoute, layerId, random = Math.random, limits = PLATFORM_GENERATION, options = {}) {
  const previousRoute = previousLayerOrRoute.route ?? previousLayerOrRoute;
  const previousPlatforms = previousLayerOrRoute.platforms ?? [previousRoute];
  const authoredAscent = options.authoredAscent ?? Math.max(0, 790 - previousRoute.y);
  const difficulty = options.difficulty ?? difficultyBandAt(authoredAscent);
  const exclusionZones = options.exclusionZones ?? [];
  // Keep the final authored approach compatible with Rysy's wider summit
  // treatment without changing the summit, its threshold, or route length.
  const forceShortSummitApproach = authoredAscent >= FINAL_WORLD_ASCENT - limits.verticalGapMax * 3;
  const routeHistory = (previousLayerOrRoute.routeHistory ?? []).slice(-4);
  let route;
  let attempts = 0;
  let fallbackStage = 0;
  const stageBudgets = [limits.candidateRetries, Math.ceil(limits.candidateRetries / 2), Math.ceil(limits.candidateRetries / 2)];
  const mustRestoreWidthVariety = routeHistory.length >= 4
    && routeHistory.slice(-4).every(({ widthClass }) => widthClass === 'short');
  for (let stage = 0; stage < stageBudgets.length && !route; stage += 1) {
    fallbackStage = stage;
    let heldShortCandidate = null;
    for (let stageAttempt = 0; stageAttempt < stageBudgets[stage]; stageAttempt += 1) {
      attempts += 1;
      const candidate = routeCandidate(previousRoute, layerId, random, limits, difficulty, forceShortSummitApproach);
      if (isRouteReachable(previousRoute, candidate, limits)
          && clearsPreviousLayer(candidate, previousPlatforms, limits)
          && clearsExclusions(candidate, exclusionZones)
          && meetsRouteQuality(previousRoute, previousPlatforms, candidate, routeHistory, difficulty, stage)) {
        // Strict corridor filtering naturally admits narrow ledges more often.
        // In the two late bands, briefly hold an otherwise valid short ledge so
        // the authored medium/long samples get a bounded chance to survive.
        const widthVarietyAttempts = {
          intro: 5, climb: 3, 'high-mountains': 4, 'summit-push': 3,
        }[difficulty.id] ?? 0;
        if (candidate.widthClass === 'short'
            && (stageAttempt < widthVarietyAttempts || mustRestoreWidthVariety)) {
          heldShortCandidate ??= candidate;
          continue;
        }
        route = candidate;
        break;
      }
    }
    if (stage === stageBudgets.length - 1) route ??= heldShortCandidate;
  }
  const usedFallback = !route;
  if (!route) {
    fallbackStage = 3;
    route = fallbackRoute(previousRoute, previousPlatforms, layerId, limits, exclusionZones, difficulty);
  }
  route.passiveDepth = landablePassiveDepth(previousPlatforms, route);
  const nextHistory = [...routeHistory, routeTransitionRecord(previousRoute, route)].slice(-4);
  return {
    id: layerId,
    route,
    platforms: [route, ...secondaryCandidates(route, previousPlatforms, layerId, random, limits, difficulty, exclusionZones)],
    attempts,
    usedFallback,
    fallbackStage,
    routeHistory: nextHistory,
    difficultyBand: difficulty.id,
  };
}

export function estimateCleanRunDuration({
  finalAscent = FINAL_WORLD_ASCENT,
  typicalVerticalGap = (PLATFORM_GENERATION.verticalGapMin + PLATFORM_GENERATION.verticalGapMax) / 2,
  jumpCadenceSeconds = airborneTimeAtHeight(typicalVerticalGap),
} = {}) {
  const jumps = Math.ceil(finalAscent / typicalVerticalGap);
  return { finalAscent, typicalVerticalGap, jumpCadenceSeconds, jumps, seconds: jumps * jumpCadenceSeconds };
}
import { PLAYER_COLLISION_WORLD_WIDTH } from './playerProfile.js';
