import type { AudioAttentionLoad } from "../types";

export function deriveLowVisualLoad(attentionLoad: AudioAttentionLoad) {
  return {
    reduceDensity: attentionLoad !== "low",
    summary:
      attentionLoad === "high"
        ? "Lower visual load may help: less scanning, fewer choices, and more breathing room."
        : "Visual load can stay lighter when you do not want to read much.",
  };
}
