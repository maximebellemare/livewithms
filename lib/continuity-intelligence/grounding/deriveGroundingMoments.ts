import type { JourneySnapshot, MeaningfulReflection } from "../../journey-design/types";
import { guardContinuityCalmness } from "../governance/guardContinuityCalmness";
import type { ContinuityMoment } from "../types";

function formatDateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getMeaningfulMomentBody(reflection: MeaningfulReflection) {
  const date = formatDateLabel(reflection.date);

  switch (reflection.reason) {
    case "grounding":
      return `A reflection from ${date} mentioned slowing the day down in a small way.`;
    case "self-kindness":
      return `A reflection from ${date} held a small note of kindness toward yourself.`;
    case "return":
      return `A reflection from ${date} pointed to returning gently after a harder stretch.`;
    case "pacing":
      return `A reflection from ${date} mentioned keeping the day simpler when that helped.`;
    default:
      return `A reflection from ${date} added a little more context to the longer view.`;
  }
}

export function deriveGroundingMoments(snapshot: JourneySnapshot | null, maxItems: number): ContinuityMoment[] {
  if (!snapshot) {
    return [];
  }

  const reflections: MeaningfulReflection[] = [];

  if (snapshot.memoryResurfacing?.reflection) {
    reflections.push(snapshot.memoryResurfacing.reflection);
  }

  for (const reflection of snapshot.selectedReflections) {
    if (!reflections.some((item) => item.date === reflection.date && item.reason === reflection.reason)) {
      reflections.push(reflection);
    }
  }

  return reflections.slice(0, maxItems).map((reflection) => ({
    title: `A quieter note from ${formatDateLabel(reflection.date)}`,
    body: guardContinuityCalmness(getMeaningfulMomentBody(reflection)),
  }));
}
