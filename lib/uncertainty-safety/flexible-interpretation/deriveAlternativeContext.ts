import type { VariabilityContext } from "../types";

export function deriveAlternativeContext(context: VariabilityContext) {
  if (context.level === "high") {
    return "Temporary strain, life context, or a shorter window may also be part of what you’re seeing.";
  }

  if (context.level === "moderate") {
    return "Short windows can look sharper than longer patterns, so more than one explanation may fit.";
  }

  return "Single days do not always explain a broader pattern on their own.";
}

