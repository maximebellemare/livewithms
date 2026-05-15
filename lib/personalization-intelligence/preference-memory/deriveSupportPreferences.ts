export function deriveSupportPreferences(input: {
  preferredSupportStyle?: string | null;
  reflectionDepthPreference?: string | null;
}) {
  return {
    style: input.preferredSupportStyle ?? "steady",
    summary:
      input.preferredSupportStyle === "practical"
        ? "Practical support may fit better than extra reflection right now."
        : input.preferredSupportStyle === "reflective"
          ? "A little more reflective space may sometimes fit better."
          : "Support can stay calm and steady without assuming one fixed style.",
    prefersDepth: input.reflectionDepthPreference === "deeper",
  };
}
