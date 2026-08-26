# Gameplay Contract

## Core loop

- Portrait vertical platformer with a continuous upward climb.
- Justyna bounces automatically upon landing; the player controls horizontal direction only and may redirect while airborne.
- Left/right world-edge wrapping remains active.
- Falling beneath the playable camera area ends the run, and restart creates a clean run.

## Endless ascent foundation

Generator V2 builds complete vertical layers rather than an isolated platform chain. Every layer owns exactly one `route` platform and may add zero, one, or two useful `secondary` platforms. The route platform must be a practical continuation from the preceding route anchor; secondaries provide alternate or recovery landings and are admitted only when they do not overlap the route or obstruct its upward corridor. Platforms are generated far enough ahead of the upward-only camera, and old platform objects and layer records are pruned below it to bound accumulation.

The bootstrap-safe envelope remains 105–130 gameplay units. Horizontal reach is derived from airborne time at the unchanged gravity and bounce velocity, then multiplied by steering speed and a conservative touch-input safety factor. Normal route candidates do not require edge wrapping even though ordinary left/right world wrap remains available.

Candidate validation combines world margins, physics-derived reachability, and a pure overhead-clearance rule. At close vertical gaps the permitted horizontal overlap is a fraction of the narrower platform: short targets receive more tolerance, while two long platforms receive substantially less. Tolerance increases with vertical separation. This width-aware rule deliberately displaces close ledges and leaves an understandable lateral jump corridor. Runtime platforms are also one-way landing surfaces, so an upward-moving player cannot collide with their underside as a ceiling.

Each layer makes at most 18 random route attempts. If none passes, a deterministic search places a conservative short or medium route platform within the world and reachable envelope. This bounded fallback prioritizes progress over variety and cannot spin indefinitely.

Procedural widths retain short (104–128), medium (142–168), and long (184–210) classes. Their tunable bootstrap sampling weights are 50%, 35%, and 15%; long ledges are intentionally least common. These values and secondary-platform density are safe foundation settings for mobile play, **not final difficulty progression or final gameplay balance**.

The initial generated-looking ledge is replaced by a dedicated 390-unit start floor. It is centered at logical x=195, reaches both viewport edges, has a full-width landing collider, and is excluded from procedural width sampling. Justyna begins centered safely above it; the first route layer is validated from this floor.

Run ascent begins at zero and is deterministically derived from the player's highest upward progress. It never decreases while the player descends. Internal ascent units are converted for `HEIGHT` with piecewise-linear interpolation through the explicit checkpoint threshold/elevation anchors, including the origin. The displayed value clamps to `0–4805 m`; this is a normalized progress presentation, not a claim that one world pixel equals one metre.

## Checkpoint architecture

A checkpoint model supports `{ id, name, elevationMeters, ascentThreshold, finalSummit }`. Checkpoints progress once through pending, spawned, and reached states. Their sign and Kaya decorations have no collision bodies; victory is entered only by landing on the data-designated final summit platform. The finalized V1 table, generation rules, and celebration timing are recorded below.

## Future game-over data

Plan for the highest mountain checkpoint passed and a locally saved high score. These remain future work; maximum achieved ascent is now implemented per run.

## V1 final climb balance

The authored route contains 17 checkpoints at these world-ascent thresholds: Trzy Korony (900), Wysoka (1,900), Jaworzyna Krynicka (3,000), Mogielica (4,200), Radziejowa (5,500), Turbacz (6,900), Tarnica (8,400), Babia Góra (10,000), Giewont (11,700), Kasprowy Wierch (13,500), Świnica (15,400), Rysy (17,400), Gerlachovský štít (23,000), Triglav (29,000), Zugspitze (35,000), Grossglockner (41,500), and the final summit Mont Blanc (48,000). HEIGHT interpolates only between these authored anchors and ends at 4,805 m.

Generation has four deterministic ascent bands: intro (0–25%), climb (25–50%), high mountains (50–75%), and summit push (75–100%). Later bands progressively favor shorter platforms, larger safe lateral steps, and fewer optional ledges. The main route always uses the unchanged conservative reachability test and bounded 18-candidate fallback.

Each checkpoint reserves source-dimension-derived rectangles around its sign/runtime text and Kaya. Following main and secondary platforms are rejected when their rendered platform rectangle intersects either reservation; the checkpoint is positioned so a bounded, reachable horizontal exit remains. Mont Blanc receives a wider, secondary-free summit layer.

The 48,000-unit route at a typical 117.5-unit gap is about 409 jumps. At the physics-derived 1.036-second ideal jump cadence, the theoretical no-delay lower-bound estimate is about 424 seconds (7:04). This is a balance sanity estimate, not a proven completion time; the intended clean-run target is 7–10 minutes, and physical Android playtesting remains authoritative.

On landing at Mont Blanc, movement, steering, gravity, animation, and TIME freeze immediately. The unobstructed summit remains visible for 1,000 ms, source-generated confetti then runs for up to 1,750 ms, and the existing victory popup appears 2,750 ms after landing with Mont Blanc, 4,805 m, and the frozen time.
