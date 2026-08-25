# Real-device validation

The gameplay background now crossfades oversized, independently positioned mountain compositions instead of vertically tiling the source artwork. Automated tests cover the positioning and recycling calculations, but cannot establish final visual quality for the WebP artwork on a physical display.

Before release, validate the following on a portrait phone:

- climb through several far- and mid-mountain transitions and inspect the top and bottom edges for gaps or visible bands;
- confirm the far layer drifts more slowly than the mid layer and neither layer appears to snap;
- fall below the active camera and confirm the current gameplay scenery and platforms freeze beneath the Run Over overlay;
- tap the visible restart control and confirm the player, height, camera, platforms, controls, and background begin from their initial state;
- repeat death and touch restart at least three times, checking for stale layers, immediate movement, duplicate controls, and duplicate input responses.

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
