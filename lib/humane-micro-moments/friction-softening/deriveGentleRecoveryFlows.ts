export function deriveGentleRecoveryFlows(input: {
  state: "error" | "retry" | "saved";
}) {
  if (input.state === "saved") {
    return "That settled in quietly.";
  }

  if (input.state === "retry") {
    return "A gentle retry can be enough.";
  }

  return "This can take another calm pass when you are ready.";
}
