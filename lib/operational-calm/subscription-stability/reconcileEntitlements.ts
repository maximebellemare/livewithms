export function reconcileEntitlements(input: {
  remoteStatus: "free" | "active" | null;
  cachedStatus: "free" | "active" | null;
  graceActive: boolean;
}) {
  if (input.remoteStatus === "active") {
    return "active" as const;
  }

  if (input.graceActive && input.cachedStatus === "active") {
    return "active" as const;
  }

  return input.remoteStatus ?? input.cachedStatus ?? "free";
}
