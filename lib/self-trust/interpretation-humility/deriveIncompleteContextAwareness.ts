export function deriveIncompleteContextAwareness(channel: "coach" | "insight-summary" | "insight-list-item") {
  if (channel === "coach") {
    return "This is meant as support, and it may miss parts of your experience.";
  }

  if (channel === "insight-list-item") {
    return "These notes stay approximate.";
  }

  return "This is a supportive lens, and it may not capture everything that shaped these days.";
}
