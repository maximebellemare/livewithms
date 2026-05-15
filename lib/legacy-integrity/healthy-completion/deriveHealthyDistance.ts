export function deriveHealthyDistance(input: { totalCheckIns: number; wantsLessIllnessCentrality?: boolean }) {
  if (input.totalCheckIns > 0 && input.wantsLessIllnessCentrality) {
    return "Needing less tracking or less illness-centrality can be a healthy shift, not a failure to keep up.";
  }

  return "A useful support tool should also make room for distance.";
}
