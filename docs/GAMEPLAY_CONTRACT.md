# Gameplay Contract

## Core loop

- Portrait vertical platformer with a continuous upward climb.
- Justyna bounces automatically upon landing; the player controls horizontal direction only and may redirect while airborne. Horizontal input accelerates at 900 world units/s² toward the unchanged 205 world units/s cap; releasing uses 1,200 world units/s² drag, so stopping is quick but not instantaneous and reversal takes finite time.
- Left/right world-edge wrapping remains active.
- Falling beneath the playable camera area ends the run, and restart creates a clean run.

## Endless ascent foundation

Generator V4 retains the complete-layer architecture: every layer owns exactly one `route` platform and may add zero, one, or, uncommonly, two useful `secondary` platforms. The route platform must be a practical continuation from the preceding route anchor; secondaries provide occasional alternate or recovery landings and are admitted only when they do not overlap the route or obstruct its upward corridor. Platforms are generated far enough ahead of the upward-only camera, and old platform objects and layer records are pruned below it to bound accumulation.

The bootstrap-safe envelope remains 105–130 gameplay units. Horizontal reach analytically integrates a from-rest acceleration phase and, when reached, a capped-speed phase over airborne time at the unchanged gravity and bounce velocity. A 0.75 safety factor reserves margin for touch timing and landing setup. Normal routes never require prior momentum or edge wrapping, although both can remain useful to skilled or recovering players.

Candidate validation combines world margins, physics-derived reachability, and a pure overhead-clearance rule. At close vertical gaps the permitted horizontal overlap is a fraction of the narrower platform: short targets receive more tolerance, while two long platforms receive substantially less. Tolerance increases with vertical separation. This width-aware rule deliberately displaces close ledges and leaves an understandable lateral jump corridor. Runtime platforms are also one-way landing surfaces, so an upward-moving player cannot collide with their underside as a ceiling.

Each layer makes at most 18 random route attempts. If none passes, a deterministic search places a conservative short or medium route platform within the world and reachable envelope. This bounded fallback prioritizes progress over variety and cannot spin indefinitely.

Procedural widths retain short (104–128), medium (142–168), and long (184–210) classes. Generator V4 applies the progression-specific weights recorded below rather than shrinking those established dimensions.

The initial generated-looking ledge is replaced by a dedicated 390-unit start floor. It is centered at logical x=195, reaches both viewport edges, has a full-width landing collider, and is excluded from procedural width sampling. Justyna begins centered safely above it; the first route layer is validated from this floor.

Run ascent begins at zero and is deterministically derived from the player's highest upward progress. It never decreases while the player descends. Internal ascent units are converted for `HEIGHT` with piecewise-linear interpolation through the explicit checkpoint threshold/elevation anchors, including the origin. The displayed value clamps to `0–2499 m`; this is a normalized progress presentation, not a claim that one world pixel equals one metre.

## Checkpoint architecture

A checkpoint model supports `{ id, name, elevationMeters, ascentThreshold, finalSummit }`. Checkpoints progress once through pending, spawned, and reached states. Their sign and Kaya decorations have no collision bodies; victory is entered only by landing on the data-designated final summit platform. The finalized V1 table, generation rules, and celebration timing are recorded below.

## Future game-over data

Plan for the highest mountain checkpoint passed and a locally saved high score. These remain future work; maximum achieved ascent is now implemented per run.

## V4 final climb balance

The Polish-only authored route contains 18 checkpoints: Trzy Korony (1,200), Wysoka (2,600), Jaworzyna Krynicka (4,200), Mogielica (6,000), Skrzyczne (8,000), Radziejowa (10,400), Turbacz (13,100), Tarnica (16,100), Pilsko (19,500), Śnieżka (23,400), Babia Góra (27,700), Giewont (32,400), Kasprowy Wierch (37,500), Krzesanica (43,100), Starorobociański Wierch (49,100), Kozi Wierch (55,500), Świnica (62,500), and the final summit Rysy (70,000). HEIGHT interpolates only between these authored anchors and ends at 2,499 m.

Generation has four deterministic ascent bands: intro (0–12.5%), climb (12.5–45%), high mountains (45–72%), and summit push (72–100%). Their short/medium/long sampling weights are respectively 35/50/15, 58/34/8, 68/29/3, and 74/24/2 percent. Ordinary lateral targets use 60–90%, 70–95%, 75–98%, and 80–100% of conservative from-rest allowance. Later bands progressively reduce collision-aware stationary corridors (preferred maxima 90, 75, 68, and 62 units), cap preferred passive chains at one, and request any secondary on approximately 30%, 23%, 15%, and 10% of layers (actual admitted density is lower after safety checks). The intended result is easy/medium but not trivial: most post-intro jumps ask for a conscious direction and hold without becoming precision targets. The main route always uses conservative reachability and bounded candidate/fallback stages.

Passive-chain depth tracks the intersection shared by every platform in the chain, rather than adding pairwise passive results whose usable corridors move to different horizontal positions. One-way collision clearance gives occasional long breathing targets bounded overlap on their approach and exit. Near an edge, a sampled outward step is reflected inward when the same distance remains valid; recent direction history then prefers breaking strict alternation when space permits. These quality rules restore width and direction rhythm without weakening direct, non-wrap reachability.

Each checkpoint reserves source-dimension-derived rectangles around its sign/runtime text and Kaya. Following main and secondary platforms are rejected when their rendered platform rectangle intersects either reservation; the checkpoint is positioned so a bounded, reachable horizontal exit remains. Rysy receives a wider, secondary-free summit layer.

The 70,000-unit route uses a typical 117.5-unit gap and calculates each typical landing with `airborneTimeAtHeight(117.5)`, because the destination is above the launch platform. Jump count is `ceil(70000 / 117.5)` and the **theoretical clean-route lower bound** is that count multiplied by the elevated-platform landing time (approximately 7.5 minutes with current physics). This is not a proven completion time; the intended theoretical minimum is 7–8 minutes, and physical Android playtesting remains authoritative.

On landing at Rysy, movement, steering, gravity, animation, and TIME freeze immediately. The unobstructed summit remains visible for 1,000 ms, source-generated confetti then runs for up to 1,750 ms, and the existing victory popup appears 2,750 ms after landing with Rysy, 2,499 m, and the frozen time.
