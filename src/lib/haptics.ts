/**
 * Lightweight haptic feedback via the Vibration API.
 * Falls back silently on devices/browsers that don't support it.
 * Each pattern is intentionally subtle — a single short pulse.
 */

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Silently ignore — not all environments support vibration
  }
}

/** Light tap — saving, toggling, confirming (10ms) */
export function hapticLight() {
  vibrate(10);
}

/** Medium tap — completing exercises, posting (20ms) */
export function hapticMedium() {
  vibrate(20);
}

/** Success pattern — milestone, generation complete (two short pulses) */
export function hapticSuccess() {
  vibrate([15, 50, 15]);
}
