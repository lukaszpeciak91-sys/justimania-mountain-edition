# Asset Contract

## Justyna MVP sprite sheet

The future canonical source is `public/assets/player/justyna-sheet.png`. Prefer one transparent **2 × 2** sheet with equal-sized frames in row-major order:

| Position | State |
| --- | --- |
| top-left | `idle` |
| top-right | `jump` |
| bottom-left | `fall` |
| bottom-right | `land` |

Every frame must have identical dimensions. Justyna's alignment and normalized feet/ground-contact point must remain consistent; do not crop canvases per state. Horizontal facing should normally use Phaser `flipX`, not duplicate left/right art.

Collision bodies are gameplay data and must be defined independently of decorative transparent pixels. They must not change arbitrarily by animation state. If future art proves another layout materially better, update this contract before changing loaders.

## Paths and separation

- Player art: `public/assets/player/`
- Layered scenery: `public/assets/backgrounds/`
- Platform visuals: `public/assets/platforms/`
- Interface visuals: `public/assets/ui/`

Final visual assets never belong inside gameplay modules. Background layers will support distant mountain, optional midground, parallax scroll factors, and later biome progression while the camera ascends. Background handling remains separate from platform generation.
