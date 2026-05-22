type PremiumCalmCommunityInput = {
  hasPremiumAccess: boolean;
  featureEnabled: boolean;
  density: "minimal" | "light" | "open";
  safeSpaces: string[];
  lowPressureTopics: string[];
  sharedHumanThemes: string[];
  note?: {
    title: string;
    body: string;
  } | null;
  fatigue: "low" | "moderate" | "high";
  lowEnergyMode: boolean;
};

export type PremiumCalmCommunitySummary = {
  title: string;
  atAGlance: string;
  sharedExperiences: string[];
  gentleInteractions: string[];
  moderationNotes: string[];
  continuityNote: string;
  hasEnoughData: boolean;
  fallbackMessage?: string;
};

const FALLBACK_MESSAGE = "Quieter shared experiences can stay available whenever connection would help.";

const BANNED_PATTERNS = /\bexclusive community\b|\bsocial support network\b|\bai-powered community\b|\btop contributors\b|\bviral\b|\bfollowers?\b|\blikes?\b|\branking\b|\btrending\b|\bendless scroll(?:ing)?\b/gi;

function sanitizeCalmCommunity(text: string) {
  return text.replace(BANNED_PATTERNS, "shared space").replace(/\s+/g, " ").trim();
}

function clampLines(lines: string[], limit: number) {
  return lines
    .map(sanitizeCalmCommunity)
    .filter(Boolean)
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, limit);
}

function formatSpace(space: string) {
  return space === "cognitive-support"
    ? "brain fog and calmer focus"
    : space === "pacing"
      ? "pacing through slower days"
      : space === "fatigue"
        ? "rest and lower-energy stretches"
        : space === "sleep"
          ? "sleep and steadier recovery"
          : space === "recovery"
            ? "recovery rhythms"
            : space.replace(/-/g, " ");
}

export function derivePremiumCalmCommunitySummary(
  input: PremiumCalmCommunityInput,
): PremiumCalmCommunitySummary {
  const limit = input.lowEnergyMode || input.density === "minimal" ? 1 : 2;

  if (input.safeSpaces.length === 0 && input.lowPressureTopics.length === 0) {
    return {
      title: "Quiet community spaces",
      atAGlance: FALLBACK_MESSAGE,
      sharedExperiences: [],
      gentleInteractions: [],
      moderationNotes: [],
      continuityNote: "Connection can stay optional, brief, and low-pressure here.",
      hasEnoughData: false,
      fallbackMessage: FALLBACK_MESSAGE,
    };
  }

  const sharedExperiences = clampLines(
    [
      ...input.lowPressureTopics,
      ...input.safeSpaces.map(formatSpace),
      ...(input.sharedHumanThemes.length > 0
        ? [`Shared experiences may quietly gather around ${input.sharedHumanThemes[0]}.`]
        : []),
    ],
    limit + 1,
  );

  const gentleInteractions = clampLines(
    [
      "This resonated",
      "Quiet acknowledgement",
      "A brief supportive note",
      input.fatigue === "high" ? "Read only for now" : "A short low-pressure reply",
    ],
    limit + 1,
  );

  const moderationNotes = clampLines(
    [
      "This space stays slower, with no popularity signals or competitive dynamics.",
      input.note ? "Heavier or fear-sharpening language can be softened before it leads the room." : "Grounding reflections can stay ahead of more emotionally loaded ones.",
      input.density === "minimal"
        ? "When the day already feels full, the space can narrow instead of asking for more attention."
        : "Participation can stay occasional without needing constant updates.",
    ],
    limit + 1,
  );

  const atAGlance = sanitizeCalmCommunity(
    input.note?.body ??
      (input.fatigue === "high"
        ? "A quieter sense of human connection may help more than a crowded conversation right now."
        : "Shared understanding can stay gentle, slower, and low-pressure here."),
  );

  const continuityNote = sanitizeCalmCommunity(
    input.lowEnergyMode
      ? "Connection can stay brief and light when more would feel like too much."
      : "Support from people who understand can stay present without turning into a feed or a performance.",
  );

  return {
    title: "Quiet community spaces",
    atAGlance,
    sharedExperiences,
    gentleInteractions,
    moderationNotes,
    continuityNote,
    hasEnoughData: true,
  };
}

export function canAccessPremiumCalmCommunity(hasPremiumAccess: boolean, featureEnabled: boolean) {
  return hasPremiumAccess && featureEnabled;
}
