# Gameplay Contract

## Core loop

- Portrait vertical platformer with a continuous upward climb.
- Justyna bounces automatically upon landing; the player controls horizontal direction only and may redirect while airborne.
- Left/right world-edge wrapping remains active.
- Falling beneath the playable camera area ends the run, and restart creates a clean run.

## Endless ascent foundation

Platforms are generated above the highest generated platform far enough ahead of the upward-only camera, and platforms far below it are destroyed to bound accumulation. Explicit conservative vertical-gap, horizontal-step, width, and margin limits are based on the current gravity, bounce velocity, and steering speed. This is an intentionally reachable foundation, not final balance.

Run ascent begins at zero and is deterministically derived from the player's highest upward progress. It never decreases while the player descends. The temporary `HEIGHT` HUD exposes gameplay ascent units; it does not claim metres.

## Checkpoint architecture

A checkpoint model supports `{ id, name, elevationMeters, ascentThreshold }`. Milestone data is separate from the renderer, which attaches a supplied sign or fallback to a platform and draws localizable text dynamically. No canonical milestones are populated in this increment.

## Mountain progression (future)

Final real-mountain identity, naming, elevations, ordering, and gameplay thresholds require later research and explicit approval. Gameplay may compress real elevation differences; pixel distance is never presented as a literal 1:1 measure of metres. No provisional concept list is canonical gameplay content.

## Future game-over data

Plan for the highest mountain checkpoint passed and a locally saved high score. These remain future work; maximum achieved ascent is now implemented per run.
