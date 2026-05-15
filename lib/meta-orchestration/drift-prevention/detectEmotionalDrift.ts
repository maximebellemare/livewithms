export function detectEmotionalDrift(input: {
  toneProfiles: Array<"quiet" | "grounded" | "reflective">;
  emotionalSurfaceCount: number;
}) {
  const unique = Array.from(new Set(input.toneProfiles));
  const reasons: string[] = [];

  if (unique.length >= 3) {
    reasons.push("too-many-tone-profiles");
  }

  if (input.emotionalSurfaceCount >= 4) {
    reasons.push("too-many-emotional-surfaces");
  }

  return {
    drifted: reasons.length > 0,
    reasons,
  };
}
