export const FONT_READY_TIMEOUT_MS = 2750;

export async function waitForRequiredFonts(fontSet, timeoutMs = FONT_READY_TIMEOUT_MS) {
  if (!fontSet?.load) return;

  let timeoutId;
  const timeout = new Promise((resolve) => {
    timeoutId = globalThis.setTimeout(resolve, timeoutMs);
  });
  const requiredFonts = Promise.all([
    fontSet.load('45px Bungee'),
    fontSet.load('italic 700 24px "Barlow Condensed"'),
    fontSet.ready,
  ]).catch(() => undefined);

  await Promise.race([requiredFonts, timeout]);
  globalThis.clearTimeout(timeoutId);
}
