export function deriveInteractionSoftness(input: {
  emphasis?: "standard" | "soft";
}) {
  return {
    buttonOpacityPressed: input.emphasis === "soft" ? 0.93 : 0.9,
    borderSoftness: input.emphasis === "soft" ? "high" : "medium",
    confirmationTone: input.emphasis === "soft" ? "gentle" : "steady",
  } as const;
}
