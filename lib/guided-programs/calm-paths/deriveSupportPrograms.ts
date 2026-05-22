import type { GuidedProgramAdaptiveState } from "../types";

export function deriveSupportPrograms(input: {
  adaptiveStatePrimary: GuidedProgramAdaptiveState;
  suggestedToolId: string | null;
  supportTags: Array<"stress" | "sleep" | "fatigue" | "reflection" | "planning" | "overwhelm" | "brain-fog">;
}) {
  const priorities: string[] = [];

  if (input.adaptiveStatePrimary === "OVERWHELMED") {
    priorities.push("nervous-system-reset", "energy-support");
  } else if (input.adaptiveStatePrimary === "LOW_ENERGY") {
    priorities.push("energy-support", "nervous-system-reset");
  } else if (input.adaptiveStatePrimary === "WITHDRAWN") {
    priorities.push("gentle-planning", "nervous-system-reset");
  } else {
    priorities.push("nervous-system-reset", "gentle-planning", "heavier-day-reflection");
  }

  if (input.supportTags.includes("reflection")) {
    priorities.push("heavier-day-reflection");
  }

  if (input.supportTags.includes("overwhelm")) {
    priorities.push("overwhelm-support");
  }

  if (input.supportTags.includes("brain-fog")) {
    priorities.push("brain-fog-support");
  }

  return {
    primaryModuleIds: Array.from(new Set(priorities)).slice(0, 3),
    preferredToolId: input.suggestedToolId,
  };
}
