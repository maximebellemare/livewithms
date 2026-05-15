export function deriveInteractionTiming(input: {
  preferredCheckinWindows?: string[] | null;
  reminderWindow?: string | null;
}) {
  const preferredWindow = input.preferredCheckinWindows?.[0] ?? input.reminderWindow ?? "evening";

  return {
    preferredWindow,
    summary: `A ${preferredWindow} rhythm may fit more naturally than pushing for a fixed schedule.`,
  };
}
