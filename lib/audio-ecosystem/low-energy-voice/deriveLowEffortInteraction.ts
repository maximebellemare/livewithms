import type { AudioAttentionLoad } from "../types";

export function deriveLowEffortInteraction(attentionLoad: AudioAttentionLoad) {
  if (attentionLoad === "high") {
    return "Lower-effort interaction may help: fewer taps, shorter prompts, and easier stopping points.";
  }

  return "Interaction can stay light, with short prompts and no need to keep going.";
}
