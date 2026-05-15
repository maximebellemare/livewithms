export function preserveLongTermTrust(input: {
  governanceValid: boolean;
  autonomyValid: boolean;
  manipulationDrifted: boolean;
}) {
  return {
    stable: input.governanceValid && input.autonomyValid && !input.manipulationDrifted,
    summary:
      input.governanceValid && input.autonomyValid && !input.manipulationDrifted
        ? "Long-term trust remains protected by practical human-centered limits."
        : "Long-term trust is at risk and should be re-centered around dignity, autonomy, and restraint.",
  };
}
