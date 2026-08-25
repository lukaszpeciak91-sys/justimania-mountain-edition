# Asset Contract

## Manual binary ownership

All binary game art is supplied manually by the user. Codex must not generate, redraw, convert, optimize, resize, overwrite, re-encode, or commit replacement PNG/WebP files. Runtime scaling, tiling, frame selection, and NineSlice rendering do not modify source files. Missing files must fall back to code-drawn primitives without preventing boot.

## Canonical paths

These paths and filenames are frozen:

- `public/assets/backgrounds/menu-bg.webp`
- `public/assets/backgrounds/game-sky.webp`
- `public/assets/backgrounds/game-mountains-far.webp`
- `public/assets/backgrounds/game-mountains-mid.webp`
- `public/assets/player/justyna-sheet.png`
- `public/assets/platforms/platform-rock.png`
- `public/assets/ui/checkpoint-sign.png`

## Justyna sprite sheet

`justyna-sheet.png` is 1536 × 1536, arranged as a 2 × 2 sheet of 768 × 768 frames loaded with `frameWidth: 768` and `frameHeight: 768`.

| Frame | Position | State |
| --- | --- | --- |
| 0 | top-left | `idle` |
| 1 | top-right | `jump` |
| 2 | bottom-left | `fall` |
| 3 | bottom-right | `land` |

Frames are selected from motion state rather than played as a sequence. Horizontal facing uses Phaser `flipX`. All frames must share aligned feet. A normalized Arcade body remains independent of the full transparent frame and stable between states.

## Runtime visual rules

- Background render order is sky, far mountains, mid mountains, then gameplay objects. Layers tile at runtime for long upward travel and use distinct parallax rates.
- `platform-rock.png` is scaled to gameplay widths at runtime with NineSlice: decorative end caps stay intact while the center scales. No resized derivatives are permitted. Visual and collision widths must agree, while collision height remains separately defined around the landing surface.
- Until the user-supplied platform artwork is available for inspection, NineSlice boundaries are explicitly provisional source-relative values: 18% left cap, 18% right cap, 22% top slice, and 22% bottom slice. They must be visually validated and tuned against the real asset on a portrait device; the implementation makes no claim of visual correctness before that validation.
- `checkpoint-sign.png` contains no baked mountain text. Mountain name/elevation are centered, high-contrast Phaser text so content can be localized later.
- Successfully loaded canonical art always takes priority over placeholders.
