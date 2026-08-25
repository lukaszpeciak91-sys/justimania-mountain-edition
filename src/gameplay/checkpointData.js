export const MAX_NORMALIZED_HEIGHT_METERS = 2499;

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
  { id: 'rysy', name: 'Rysy', elevationMeters: 2499, ascentThreshold: 17400, finalSummit: true },
].map(Object.freeze));

export const FINAL_SUMMIT = MOUNTAIN_CHECKPOINTS.at(-1);

export const CHECKPOINT_DECORATION_SPEC = Object.freeze({
  collision: false,
  sign: Object.freeze({ dynamicText: true, assetKey: 'checkpoint-sign' }),
  kaya: Object.freeze({ assetKey: 'kaya-the-dog', columns: 3, sequence: Object.freeze([0, 1, 2, 1]), frameRate: 7 }),
});

export const CHECKPOINT_VISUALS = Object.freeze({
  // 1166:1349 source aspect, scaled without touching the supplied PNG.
  signWidth: 102,
  signHeight: 118,
  normalFontSize: 16,
  longNameFontSize: 14,
  kayaTargetHeight: 70,
  platformTopOverlap: 2,
});

// BackgroundManager uses depths -20 through -16; default gameplay sprites use
// zero. Checkpoint art therefore sits in front of scenery and behind Justyna.
export const WORLD_DEPTH = Object.freeze({ checkpointDecoration: -5, player: 0, hud: 20 });
