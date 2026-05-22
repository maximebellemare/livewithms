import type { ProgramLibraryCategory, ProgramModule, ProgramSection } from "./types";

export function deriveProgramSectionLabel(section: ProgramSection) {
  switch (section) {
    case "Calm":
      return "Grounding";
    case "Energy":
      return "Low energy";
    case "Planning":
      return "Pacing";
    case "Rest":
      return "Sleep and rest";
    case "Reflection":
      return "Reflection";
    default:
      return section;
  }
}

export function deriveProgramSectionSubtitle(section: ProgramSection) {
  switch (section) {
    case "Calm":
      return "Grounding and nervous-system support.";
    case "Energy":
      return "Lower-demand support for heavier days.";
    case "Planning":
      return "Gentler structure when the day feels crowded.";
    case "Rest":
      return "Quieter evening and sleep support.";
    case "Reflection":
      return "Light reflection without overprocessing.";
    default:
      return "Gentle structured support.";
  }
}

export function deriveProgramCategoryLabel(category: ProgramLibraryCategory | null | undefined) {
  switch (category) {
    case "grounding":
      return "Grounding";
    case "overwhelm":
      return "Overwhelm";
    case "low-energy":
      return "Low energy";
    case "sleep":
      return "Sleep";
    case "pacing":
      return "Pacing";
    case "brain-fog":
      return "Brain fog";
    case "emotional-regulation":
      return "Emotional decompression";
    default:
      return "Support";
  }
}

export function deriveRecommendedProgramCopy(input: {
  module: ProgramModule;
  lowEnergyMode: boolean;
  highFatigue: boolean;
  overwhelmed: boolean;
}) {
  if (input.lowEnergyMode || input.highFatigue) {
    return {
      label: "A quieter fit for today",
      body: `${input.module.whyItHelps} This one can stay brief and easier to step away from.`,
    };
  }

  if (input.overwhelmed) {
    return {
      label: "A steadier place to begin",
      body: `${input.module.whyItHelps} It can help to start with one quieter support surface.`,
    };
  }

  return {
    label: "Worth considering today",
    body: `${input.module.whyItHelps} This may be a gentle place to begin if you want a little structure.`,
  };
}

export function derivePremiumProgramsCopy(input: {
  lowEnergyMode: boolean;
  overwhelmed: boolean;
  highFatigue: boolean;
}) {
  if (input.lowEnergyMode || input.highFatigue) {
    return {
      title: "A deeper library for heavier days",
      body: "Premium includes a deeper library of calming programs and low-energy support when the day needs less friction.",
    };
  }

  if (input.overwhelmed) {
    return {
      title: "More support when everything feels loud",
      body: "Premium includes shorter overwhelm resets, pacing tools, and calmer decompression support for harder stretches.",
    };
  }

  return {
    title: "A deeper library of calmer support",
    body: "Premium includes more grounding, sleep, brain fog, pacing, and low-energy programs that still stay short and interruption-safe.",
  };
}
