# Real-device validation

The gameplay background now crossfades oversized, independently positioned mountain compositions instead of vertically tiling the source artwork. Automated tests cover the positioning and recycling calculations, but cannot establish final visual quality for the WebP artwork on a physical display.

Before release, validate the following on a portrait phone:

- climb through several far- and mid-mountain transitions and inspect the top and bottom edges for gaps or visible bands;
- confirm the far layer drifts more slowly than the mid layer and neither layer appears to snap;
- fall below the active camera and confirm the current gameplay scenery and platforms freeze beneath the Run Over overlay;
- tap the visible restart control and confirm the player, height, camera, platforms, controls, and background begin from their initial state;
- repeat death and touch restart at least three times, checking for stale layers, immediate movement, duplicate controls, and duplicate input responses.

## Menu Justyna + Kaya foreground (not yet physically validated)

The canonical user-owned image is `public/assets/ui/menu-justyna-kaya.png` (`menu-justyna-kaya`). It is a separate, non-interactive transparent foreground layer with a 420 ms upward fade (`1 ms` with reduced motion), a 330 logical px height target, and runtime uniform scaling. Automated checks cannot establish its final placement, source transparency, or touch behavior on a portrait phone. Complete this exact checklist on the physical target device:

1. Open the menu.
2. Confirm only background + JUSTIMANIA are initially visible.
3. Tap once.
4. Confirm MOUNTAIN EDITION reveals left-to-right.
5. Confirm Justyna + Kaya enter at the same time.
6. Confirm the duo does not cover either title line.
7. Confirm the duo is not clipped.
8. Confirm Kaya is clearly visible.
9. Confirm START appears only after reveal completion.
10. Confirm START remains fully tappable.
11. Confirm tapping around the foreground image does not trigger unexpected input.
12. Enter GameScene.
13. Return to MenuScene.
14. Confirm the foreground sequence resets correctly.
15. Repeat at least twice and confirm no duplicate foreground images/tweens appear.

Also confirm the PNG has genuine transparent surroundings. If opaque background pixels are visible, correct the user-supplied source asset rather than adding a runtime matte or modifying the binary. Do not sign off final visual placement or physical Android behavior until this pass is complete.

## Game Over navigation regression

The earlier Android failure cannot be signed off by unit tests alone. Complete this
exact sequence on a real portrait phone after deployment:

1. Start a run, die, and tap **RESTART** once; confirm a fresh run starts.
2. Die again and tap **MENU** once; confirm a freshly initialized MenuScene appears.
3. Reveal **START**, start another run, die, and tap **RESTART** again.
4. Repeat the die/restart cycle until **RESTART** has succeeded at least three times.
5. Throughout the sequence, confirm there are no dead buttons, double transitions,
   stale overlays, or broken steering controls after a restart.

Also try rapid repeated taps and alternating taps on **RESTART** and **MENU**. Exactly
one transition must be accepted from each Game Over overlay.

For the Android input hotfix, use this exact real-device sequence on a fresh deployment:

1. Open the fresh deployment.
2. Start the game.
3. Die.
4. Tap **RESTART** once in the center of the visible button.
5. Confirm a fresh run starts immediately.
6. Die again.
7. Tap **MENU** once.
8. Confirm MenuScene opens.
9. Start another run.
10. Repeat **RESTART** at least three times.
11. Tap near the button edges and confirm the full visible button area works.
12. Confirm the gameplay left/right touch zones do not intercept Game Over buttons.
13. If victory is reachable/testable, verify **PLAY AGAIN** and **MENU** as well.

Do not treat automated checks as physical Android sign-off; record this sequence as
remaining until it has been completed on an actual device.

Visual seam quality should only be signed off after this device pass.

## Gameplay music (not yet physically validated)

The canonical user-owned track is `public/assets/audio/game-theme.mp3` (`game-theme`). It is gameplay-only, loops through Phaser at the default volume `0.32`, and intentionally has no menu counterpart. Automated ownership tests cannot validate browser autoplay policy, audible duplication, or final balance on a physical phone. Do not treat this checklist as signed off until it is completed on a portrait Android device:

1. Open a fresh deployment.
2. Reveal **START**.
3. Tap **START**.
4. Confirm gameplay music begins.
5. Confirm only one copy is audible.
6. Die and press **RESTART**.
7. Confirm music is still single-instance.
8. Repeat **RESTART** at least 3 times.
9. Press **MENU**.
10. Confirm gameplay music stops.
11. Start another run.
12. Confirm gameplay music starts once.
13. Reach Game Over and verify no duplicate track starts.
14. If victory is testable, confirm the victory overlay does not start another copy.
15. Background/foreground the browser once and confirm no duplicated playback appears afterward.

Also verify that a deployment without the MP3 boots and remains fully playable in silence. Record perceived volume separately; this task does not claim final audio mix or balance.

## Checkpoints and summit (not yet physically validated)

Complete the full climb on a portrait phone; automated checks do not constitute sign-off:

1. Confirm HEIGHT starts at 0 m.
2. Confirm HEIGHT increases monotonically.
3. Confirm the first checkpoint appears naturally ahead.
4. Confirm the sign is readable.
5. Confirm Kaya appears beside the sign.
6. Confirm Kaya's gentle animation loops correctly.
7. Confirm Kaya and the sign have zero collision.
8. Confirm Justyna can pass through/over their visual area without a physics response.
9. Confirm checkpoints never respawn during a run.
10. Confirm later checkpoint spacing feels meaningful (this is not final pacing balance).
11. Confirm the Rysy summit appears reliably.
12. Land on the summit and confirm Justyna stops bouncing and remains standing.
13. Confirm the lightweight celebration and victory panel appear.
14. Confirm PLAY AGAIN creates a clean zero-height run.
15. Confirm MENU returns cleanly to the normal menu intro.
16. Repeat the complete flow and confirm no stale objects, animations, controls, or listeners accumulate.
