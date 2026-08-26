export const MAX_NORMALIZED_HEIGHT_METERS = 4805;

// Gameplay thresholds are authored independently of the mountains' real-world
// elevation differences. This keeps early signs separated and lets the route
// breathe progressively more as the climb continues.
export const MOUNTAIN_CHECKPOINTS = Object.freeze([
  { id: 'trzy-korony', name: 'Trzy Korony', elevationMeters: 982, ascentThreshold: 900, finalSummit: false },
  { id: 'wysoka', name: 'Wysoka', elevationMeters: 1050, ascentThreshold: 1900, finalSummit: false },
  { id: 'jaworzyna-krynicka', name: 'Jaworzyna Krynicka', elevationMeters: 1114, ascentThreshold: 3000, finalSummit: false },
  { id: 'mogielica', name: 'Mogielica', elevationMeters: 1170, ascentThreshold: 4200, finalSummit: false },
  { id: 'radziejowa', name: 'Radziejowa', elevationMeters: 1267, ascentThreshold: 5500, finalSummit: false },
  { id: 'turbacz', name: 'Turbacz', elevationMeters: 1310, ascentThreshold: 6900, finalSummit: false },
  { id: 'tarnica', name: 'Tarnica', elevationMeters: 1346, ascentThreshold: 8400, finalSummit: false },
  { id: 'babia-gora', name: 'Babia Góra', elevationMeters: 1723, ascentThreshold: 10000, finalSummit: false },
  { id: 'giewont', name: 'Giewont', elevationMeters: 1894, ascentThreshold: 11700, finalSummit: false },
  { id: 'kasprowy-wierch', name: 'Kasprowy Wierch', elevationMeters: 1987, ascentThreshold: 13500, finalSummit: false },
  { id: 'swinica', name: 'Świnica', elevationMeters: 2301, ascentThreshold: 15400, finalSummit: false },
  { id: 'rysy', name: 'Rysy', elevationMeters: 2499, ascentThreshold: 17400, finalSummit: false },
  { id: 'gerlachovsky-stit', name: 'Gerlachovský štít', elevationMeters: 2655, ascentThreshold: 23000, finalSummit: false },
  { id: 'triglav', name: 'Triglav', elevationMeters: 2864, ascentThreshold: 29000, finalSummit: false },
  { id: 'zugspitze', name: 'Zugspitze', elevationMeters: 2962, ascentThreshold: 35000, finalSummit: false },
  { id: 'grossglockner', name: 'Grossglockner', elevationMeters: 3798, ascentThreshold: 41500, finalSummit: false },
  { id: 'mont-blanc', name: 'Mont Blanc', elevationMeters: 4805, ascentThreshold: 48000, finalSummit: true },
].map(Object.freeze));

export const FINAL_SUMMIT = MOUNTAIN_CHECKPOINTS.at(-1);

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
