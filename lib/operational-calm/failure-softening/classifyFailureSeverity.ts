import { mapTechnicalErrors } from "./mapTechnicalErrors";

export type FailureSeverity = "minor" | "moderate" | "blocking";

export function classifyFailureSeverity(error: unknown): FailureSeverity {
  const kind = mapTechnicalErrors(error);

  if (kind === "auth") {
    return "blocking";
  }

  if (kind === "subscription" || kind === "sync" || kind === "storage") {
    return "moderate";
  }

  return "minor";
}
