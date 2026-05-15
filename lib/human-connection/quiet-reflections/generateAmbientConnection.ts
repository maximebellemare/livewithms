import { moderateUnsafeContent } from "../emotional-safety/moderateUnsafeContent";
import type { AmbientConnection, SharedTheme } from "../types";

export function generateAmbientConnection(sharedThemes: SharedTheme[]): AmbientConnection | null {
  const primary = sharedThemes[0];
  if (!primary) {
    return null;
  }

  const body =
    primary.key === "pacing"
      ? "Others also return to slower pacing when days feel heavier."
      : primary.key === "rest"
        ? "Rest keeps showing up as a steady theme for other people, too."
        : primary.key === "overwhelm"
          ? "You are not alone in needing simpler support during mentally overloaded stretches."
          : primary.key === "clarity"
            ? "Others also mention that clearer days can feel uneven, not linear."
            : "Gentler ways of getting through the day come up for others, too.";

  const moderation = moderateUnsafeContent(body);
  if (!moderation.safe) {
    return null;
  }

  return {
    title: "A quiet shared note",
    body: moderation.sanitizedText,
    tone: "quiet",
  };
}

