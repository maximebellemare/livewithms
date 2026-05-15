import type { DistressSignalLevel } from "../types";

export function deriveSupportEncouragement(level: DistressSignalLevel) {
  if (level === "elevated") {
    return "If this feels especially heavy, a trusted person or qualified professional may offer steadier support than more analysis right now.";
  }

  if (level === "guarded") {
    return "If it helps, you could let a trusted person know today feels heavier than usual.";
  }

  return "Real-world support can matter just as much as anything in the app.";
}
