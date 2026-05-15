import type { JourneySnapshot } from "../../journey-design/types";

export function deriveNonIllnessMeaning(snapshot: JourneySnapshot | null) {
  if (!snapshot) {
    return null;
  }

  const text = snapshot.selectedReflections.map((entry) => entry.text.toLowerCase()).join(" ");
  if (/\bwalk\b|\bmusic\b|\bfamily\b|\bfriend\b|\breading\b|\bcooking\b|\bquiet\b/.test(text)) {
    return "Ordinary parts of life still seem to matter here, not only the health-related parts.";
  }

  return "Life can still hold ordinary meaning outside symptoms, appointments, or harder stretches.";
}
