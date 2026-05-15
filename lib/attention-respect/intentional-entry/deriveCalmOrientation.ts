import type { CalmOrientation, SessionEntryState } from "../types";

export function deriveCalmOrientation(state: SessionEntryState): CalmOrientation {
  if (state === "quiet-entry") {
    return {
      title: "You can keep this simple",
      body: "A brief check-in or one small look is enough.",
    };
  }

  if (state === "reflective-entry") {
    return {
      title: "Take what feels useful",
      body: "You can move through this at your own pace.",
    };
  }

  return {
    title: "Start where it feels manageable",
    body: "You do not need to take in everything at once.",
  };
}

