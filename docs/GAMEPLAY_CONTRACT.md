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

Run ascent begins at zero and is deterministically derived from the player's highest upward progress. It never decreases while the player descends. The temporary `HEIGHT` HUD exposes gameplay ascent units; it does not claim metres.

## Checkpoint architecture

A checkpoint model supports `{ id, name, elevationMeters, ascentThreshold }`. Milestone data is separate from the renderer, which attaches a supplied sign or fallback to a platform and draws localizable text dynamically. No canonical milestones are populated in this increment.

## Mountain progression (future)

Final real-mountain identity, naming, elevations, ordering, and gameplay thresholds require later research and explicit approval. Gameplay may compress real elevation differences; pixel distance is never presented as a literal 1:1 measure of metres. No provisional concept list is canonical gameplay content.

## Future game-over data

Plan for the highest mountain checkpoint passed and a locally saved high score. These remain future work; maximum achieved ascent is now implemented per run.
