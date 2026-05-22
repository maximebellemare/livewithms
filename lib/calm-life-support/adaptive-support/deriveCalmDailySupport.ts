import { guardCalmLifeSupportCopy } from "../calmness/guardCalmLifeSupportCopy";
import type { CalmLifeSupportPriority, CalmLifeDailySupport } from "../types";

export function deriveCalmDailySupport(priority: CalmLifeSupportPriority): CalmLifeDailySupport {
  const byPriority: Record<CalmLifeSupportPriority, CalmLifeDailySupport> = {
    grounding: {
      title: "Keep this smaller for now",
      body: "You may not need to solve everything right now for the day to become a little steadier.",
      suggestions: ["Lower one source of input", "Keep the next part smaller", "Reduce one decision"],
    },
    "low-energy": {
      title: "A lighter day is okay",
      body: "A lower-demand pace may help more than pushing for momentum right now.",
      suggestions: ["Reduce one expectation", "Keep one thing simple", "Let one task wait"],
    },
    pacing: {
      title: "A simpler next step is okay",
      body: "Reducing decisions may help more than trying to organize everything at once.",
      suggestions: ["Choose one priority", "Keep the next hour smaller", "Let one thing wait"],
    },
    uncertainty: {
      title: "The horizon can stay smaller",
      body: "You may not need to solve the future tonight for this moment to feel a little steadier.",
      suggestions: ["Come back to today", "Let one future thought wait", "Keep the next step gentle"],
    },
    rebuilding: {
      title: "Rebuilding can stay gradual",
      body: "You may not need to rebuild everything at once for steadiness to return in smaller ways.",
      suggestions: ["Keep one routine low-demand", "Reduce one expectation", "Let the return stay gradual"],
    },
    "ordinary-life": {
      title: "Ordinary life can stay small",
      body: "One familiar part of life may still help even when the wider picture feels harder to hold.",
      suggestions: ["Choose one familiar routine", "Keep one ordinary task simple", "Let engagement stay small"],
    },
    steadiness: {
      title: "A steadier pace is enough",
      body: "Smaller steadiness can still matter even when the day does not feel fully settled.",
      suggestions: ["Keep the next part quieter", "Come back to one anchor", "Let the pace stay gentler"],
    },
  };

  const support = byPriority[priority];

  return {
    title: guardCalmLifeSupportCopy(support.title),
    body: guardCalmLifeSupportCopy(support.body),
    suggestions: support.suggestions.map(guardCalmLifeSupportCopy),
  };
}
