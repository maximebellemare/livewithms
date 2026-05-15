export function generateCalmWaitingCopy(state: "steady" | "slow" | "degraded") {
  switch (state) {
    case "slow":
      return "Taking a little longer than usual…";
    case "degraded":
      return "Still working on this quietly…";
    case "steady":
    default:
      return "Thinking gently…";
  }
}
