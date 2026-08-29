export const MAX_NORMALIZED_HEIGHT_METERS = 2499;

// Gameplay thresholds are authored independently of the mountains' real-world
// elevation differences. This keeps early signs separated and lets the route
// breathe progressively more as the climb continues.
export const MOUNTAIN_CHECKPOINTS = Object.freeze([
  { id: 'trzy-korony', name: 'Trzy Korony', elevationMeters: 982, ascentThreshold: 1200, finalSummit: false },
  { id: 'wysoka', name: 'Wysoka', elevationMeters: 1050, ascentThreshold: 2600, finalSummit: false },
  { id: 'jaworzyna-krynicka', name: 'Jaworzyna Krynicka', elevationMeters: 1114, ascentThreshold: 4200, finalSummit: false },
  { id: 'mogielica', name: 'Mogielica', elevationMeters: 1170, ascentThreshold: 6000, finalSummit: false },
  { id: 'skrzyczne', name: 'Skrzyczne', elevationMeters: 1257, ascentThreshold: 8000, finalSummit: false },
  { id: 'radziejowa', name: 'Radziejowa', elevationMeters: 1267, ascentThreshold: 10400, finalSummit: false },
  { id: 'turbacz', name: 'Turbacz', elevationMeters: 1310, ascentThreshold: 13100, finalSummit: false },
  { id: 'tarnica', name: 'Tarnica', elevationMeters: 1346, ascentThreshold: 16100, finalSummit: false },
  { id: 'pilsko', name: 'Pilsko', elevationMeters: 1557, ascentThreshold: 19500, finalSummit: false },
  { id: 'sniezka', name: 'Śnieżka', elevationMeters: 1603, ascentThreshold: 23400, finalSummit: false },
  { id: 'babia-gora', name: 'Babia Góra', elevationMeters: 1723, ascentThreshold: 27700, finalSummit: false },
  { id: 'giewont', name: 'Giewont', elevationMeters: 1894, ascentThreshold: 32400, finalSummit: false },
  { id: 'kasprowy-wierch', name: 'Kasprowy Wierch', elevationMeters: 1987, ascentThreshold: 37500, finalSummit: false },
  { id: 'krzesanica', name: 'Krzesanica', elevationMeters: 2122, ascentThreshold: 43100, finalSummit: false },
  { id: 'starorobocianski-wierch', name: 'Starorobociański Wierch', elevationMeters: 2176, ascentThreshold: 49100, finalSummit: false },
  { id: 'kozi-wierch', name: 'Kozi Wierch', elevationMeters: 2291, ascentThreshold: 55500, finalSummit: false },
  { id: 'swinica', name: 'Świnica', elevationMeters: 2301, ascentThreshold: 62500, finalSummit: false },
  { id: 'rysy', name: 'Rysy', elevationMeters: 2499, ascentThreshold: 70000, finalSummit: true },
].map(Object.freeze));

export const FINAL_SUMMIT = MOUNTAIN_CHECKPOINTS.at(-1);

// A broadly east-to-west journey along the Polish Baltic coast. Thresholds
// intentionally match Mountain Edition so the shared course retains its pace.
export const BEACH_CHECKPOINTS = Object.freeze([
  ['krynica-morska', 'Krynica Morska'], ['hel', 'Hel'],
  ['jurata', 'Jurata'], ['jastarnia', 'Jastarnia'],
  ['wladyslawowo', 'Władysławowo'], ['jastrebia-gora', 'Jastrzębia Góra'],
  ['debki', 'Dębki'], ['leba', 'Łeba'], ['rowy', 'Rowy'],
  ['ustka', 'Ustka'], ['jaroslawiec', 'Jarosławiec'], ['darlowo', 'Darłowo'],
  ['mielno', 'Mielno'], ['kolobrzeg', 'Kołobrzeg'],
  ['rewal', 'Rewal'], ['dziwnow', 'Dziwnów'],
  ['miedzyzdroje', 'Międzyzdroje'], ['swinoujscie', 'Świnoujście'],
].map(([id, name], index, route) => Object.freeze({
  id,
  name,
  ascentThreshold: MOUNTAIN_CHECKPOINTS[index].ascentThreshold,
  finalSummit: index === route.length - 1,
})));

export const CHECKPOINTS_BY_EDITION = Object.freeze({
  mountain: MOUNTAIN_CHECKPOINTS,
  beach: BEACH_CHECKPOINTS,
});

export function checkpointSignLines(checkpoint, editionId = 'mountain') {
  const name = checkpoint.name.toLocaleUpperCase('pl-PL');
  return editionId === 'beach' ? [name] : [name, `${checkpoint.elevationMeters} m`];
}

export const CHECKPOINT_DECORATION_SPEC = Object.freeze({
  collision: false,
  sign: Object.freeze({ dynamicText: true, assetKey: 'checkpoint-sign' }),
  kaya: Object.freeze({ assetKey: 'kaya-the-dog', columns: 3, sequence: Object.freeze([0, 1, 2, 1]), frameRate: 7 }),
});

export const CHECKPOINT_VISUALS = Object.freeze({
  // 1166:1349 source aspect, scaled without touching the supplied PNG.
  signWidth: 122,
  signHeight: 142,
  kayaTargetHeight: 84,
  platformTopOverlap: 2,
  // Compensate for transparent padding inside the supplied artwork. These are
  // visual-only drops from the platform-derived geometry baselines.
  signVisualDrop: 26,
  kayaVisualDrop: 24,
  // Source-derived decoration reservation. Kaya's conservative width uses its
  // target height, so clearance does not depend on an unrelated world position.
  kayaReservationWidth: 84,
  exclusionPadding: 10,
});

// Provisional mobile-tuned coordinates are relative to the sign sprite's
// center. The negative Y anchor targets the wooden arrow rather than the full
// artwork bounds, which also contain the post, grass, and rocks.
export const CHECKPOINT_TEXT_LAYOUT = Object.freeze({
  signTextAnchorX: 0,
  signTextAnchorY: -30,
  textOffsetY: -2,
  mountainNameFontSize: 11,
  longMountainNameFontSize: 9,
  elevationFontSize: 9,
  lineSpacing: 1,
  longNameThreshold: 15,
});

// BackgroundManager uses depths -20 through -16; default gameplay sprites use
// zero. Checkpoint art therefore sits in front of scenery and behind Justyna.
export const WORLD_DEPTH = Object.freeze({ checkpointDecoration: -5, player: 0, hud: 20 });
