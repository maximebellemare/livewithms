import type { ContinuityDeviceSurface } from "../types";

export function deriveDeviceAccessibilityModes(surface: ContinuityDeviceSurface) {
  return {
    reduceVisualLoad: surface === "watch" || surface === "audio" || surface === "phone",
    preferGlanceable: surface === "watch",
  };
}
