export type PremiumCalmCompanionInput = {
  hasPremiumAccess: boolean;
  featureEnabled: boolean;
  lowEnergyMode: boolean;
  recentFatigueAverage?: number | null;
  recentStressAverage?: number | null;
  recentSleepAverage?: number | null;
  recentCheckIns: number;
  currentHour: number;
  reducedInteractionTolerance?: boolean;
  hasTodayEntry: boolean;
};

export type PremiumCalmCompanionState = {
  available: boolean;
  active: boolean;
  title: string;
  body: string;
  returnLine: string;
  continuityLine: string;
  microMoments: string[];
  spacing: {
    reduceSuggestionDensity: boolean;
    preserveSilence: boolean;
    quieterHomeAtmosphere: boolean;
    maxQuickLinks: number;
    maxGuidanceActions: number;
    maxReflectionCards: number;
  };
};

const BANNED_LANGUAGE = /\balways here for you\b|\bcompanion\b|\bpartner\b|\bpersonal emotional assistant\b|\bemotionally intelligent\b|\bai detected\b|\bwe noticed\b|\battached\b/gi;

function sanitizeCalmEnvironmentLine(text: string) {
  return text.replace(BANNED_LANGUAGE, "support").replace(/\s+/g, " ").trim();
}

function hasHeavierDay(input: PremiumCalmCompanionInput) {
  return (
    input.lowEnergyMode ||
    Boolean(input.reducedInteractionTolerance) ||
    (typeof input.recentFatigueAverage === "number" && input.recentFatigueAverage >= 3.8) ||
    (typeof input.recentStressAverage === "number" && input.recentStressAverage >= 3.8) ||
    (typeof input.recentSleepAverage === "number" && input.recentSleepAverage > 0 && input.recentSleepAverage < 6.3)
  );
}

function isEvening(input: PremiumCalmCompanionInput) {
  return input.currentHour >= 18;
}

export function derivePremiumCalmCompanionEnvironment(
  input: PremiumCalmCompanionInput,
): PremiumCalmCompanionState {
  const available = input.hasPremiumAccess && input.featureEnabled;
  const heavierDay = hasHeavierDay(input);
  const evening = isEvening(input);

  const title = heavierDay
    ? "A quieter way back into the day"
    : input.hasTodayEntry
      ? "A steadier place to return"
      : "A calmer way to begin";
  const body = heavierDay
    ? "The app can stay quieter, less stacked, and a little easier to re-enter when the day already feels full."
    : input.hasTodayEntry
      ? "Returning here can stay familiar and low-pressure, without asking for more than today has room for."
      : "Support can stay light, familiar, and easy to step into without making the day feel busier.";
  const returnLine = heavierDay
    ? "You can keep today smaller if needed."
    : evening
      ? "A quieter pace may help tonight."
      : "Some days may need less pressure.";
  const continuityLine =
    input.recentCheckIns >= 4
      ? "The app can stay steady over time without becoming louder."
      : "A calm return can still feel useful before much history is here.";

  const microMoments = [
    heavierDay ? "Let one thing wait." : "A brief check-in can be enough.",
    evening ? "The rest of tonight can stay small." : "A quieter pace may help today.",
    input.hasTodayEntry ? "You can stop here whenever this feels complete." : "You do not need to do everything at once.",
  ]
    .map(sanitizeCalmEnvironmentLine)
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, heavierDay ? 2 : 3);

  return {
    available,
    active: available,
    title: sanitizeCalmEnvironmentLine(title),
    body: sanitizeCalmEnvironmentLine(body),
    returnLine: sanitizeCalmEnvironmentLine(returnLine),
    continuityLine: sanitizeCalmEnvironmentLine(continuityLine),
    microMoments,
    spacing: {
      reduceSuggestionDensity: heavierDay,
      preserveSilence: heavierDay || evening,
      quieterHomeAtmosphere: heavierDay || evening,
      maxQuickLinks: heavierDay ? 2 : 3,
      maxGuidanceActions: heavierDay ? 1 : 2,
      maxReflectionCards: heavierDay ? 1 : 2,
    },
  };
}
