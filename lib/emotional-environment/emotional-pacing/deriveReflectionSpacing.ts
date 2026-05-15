import type { EmotionalDensity } from "../types";

export function deriveReflectionSpacing(density: EmotionalDensity) {
  if (density === "SPARSE") {
    return { gap: 16, topMargin: 8 };
  }

  if (density === "RICH") {
    return { gap: 10, topMargin: 0 };
  }

  return { gap: 12, topMargin: 4 };
}

