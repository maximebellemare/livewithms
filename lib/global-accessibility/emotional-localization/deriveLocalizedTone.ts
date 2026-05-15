import type { GlobalLocaleHint, LocalizedTone } from "../types";

type Input = {
  localeHint?: GlobalLocaleHint;
  preferredSupportStyle?: string | null;
  lowEnergy?: boolean;
};

export function deriveLocalizedTone({
  localeHint = "global",
  preferredSupportStyle,
  lowEnergy = false,
}: Input): LocalizedTone {
  const preferShortSentences = lowEnergy || preferredSupportStyle === "practical";
  const softenAuthority = localeHint !== "direct";

  return {
    summary: preferShortSentences
      ? "Shorter, calmer language may travel more gently across different reading styles and languages."
      : "Support can stay calm, plain, and emotionally respectful across different contexts.",
    preferShortSentences,
    avoidClinicalLiteralism: true,
    softenAuthority,
  };
}
