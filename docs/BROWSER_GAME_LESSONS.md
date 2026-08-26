# Browser Game Lessons

This file records engineering decisions that were physically validated during development and are worth reusing in future small mobile browser games.

## 2026-08-26 — Keep terminal UI outside the Phaser world when simplicity matters

### Context

Justimania Mountain Edition is a small portrait mobile browser game built with Phaser 3.

The Game Over flow went through several Phaser-only implementations:

- Game Over buttons rendered inside the scrolling `GameScene`,
- fixed-camera Phaser input targets,
- a dedicated modal `GameOverScene`,
- Phaser scene transitions triggered from a native DOM callback.

Automated tests passed, but physical Android testing repeatedly showed unreliable terminal navigation.

### Validated solution

Use a clear responsibility split:

- **Phaser owns gameplay.**
- **DOM owns simple terminal/modal UI when it does not need to participate in the game world.**

For Game Over in a small stateless browser game:

1. Freeze gameplay through normal game state/player logic.
2. Show a native DOM modal above the Phaser canvas.
3. Use a real HTML `<button>` for the terminal action.
4. If returning to the initial application state does not require preserving runtime state, use `window.location.reload()`.
5. Let the normal boot path recreate Phaser and enter the main menu.

Validated Justimania flow:

`GameScene -> Game Over DOM modal -> MENU click -> window.location.reload() -> BootScene -> MenuScene`

This was physically confirmed to work on Android.

### Why this is the preferred default for similar small games

Do not introduce scene-management complexity merely to avoid a page reload when:

- the game has no important in-memory state to preserve,
- a run is disposable,
- reload is fast,
- the desired action is effectively "return to application start".

A reload is not a failure of architecture in that case. It is a small, deterministic reset boundary.

### What not to repeat by default

For a simple terminal screen, do not immediately build:

- custom Phaser hit-area workarounds,
- extra modal scenes,
- multiple scene pause/resume/stop/start combinations,
- new terminal navigation state machines.

Only add those mechanisms when the product actually requires seamless state preservation or richer cross-scene behavior.

## Physical-device rule

For mobile browser games, automated tests are necessary but not authoritative for touch/input/lifecycle behavior.

A change affecting:

- touch input,
- overlays,
- browser/Phaser interaction,
- scene lifecycle,
- orientation,

must be considered unverified until tested on a physical target device.

## Asset-loading note

Large optional media must not block startup.

Gameplay audio should be lazy and non-fatal. A missing optional audio file must allow the game to continue silently. During Justimania testing, removing the large gameplay MP3 noticeably improved load time.

For future small games, prefer short/lightweight audio assets and keep optional media outside the critical boot path.
