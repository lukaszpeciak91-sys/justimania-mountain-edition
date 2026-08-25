# Real-device validation

The gameplay background now crossfades oversized, independently positioned mountain compositions instead of vertically tiling the source artwork. Automated tests cover the positioning and recycling calculations, but cannot establish final visual quality for the WebP artwork on a physical display.

Before release, validate the following on a portrait phone:

- climb through several far- and mid-mountain transitions and inspect the top and bottom edges for gaps or visible bands;
- confirm the far layer drifts more slowly than the mid layer and neither layer appears to snap;
- fall below the active camera and confirm the current gameplay scenery and platforms freeze beneath the Run Over overlay;
- tap the visible restart control and confirm the player, height, camera, platforms, controls, and background begin from their initial state;
- repeat death and touch restart at least three times, checking for stale layers, immediate movement, duplicate controls, and duplicate input responses.

Visual seam quality should only be signed off after this device pass.
