export function preventFearContentClustering(input: {
  requestedCount: number;
  hasProgressionTone: boolean;
  educationalLoad: "low" | "moderate" | "high";
}) {
  const maxAllowed = input.educationalLoad === "high" ? 1 : input.educationalLoad === "moderate" ? 2 : 3;

  return Math.min(input.requestedCount, input.hasProgressionTone ? Math.min(1, maxAllowed) : maxAllowed);
}
