type AdaptiveHomeInput = {
  hasPremiumAccess: boolean;
  featureEnabled: boolean;
  lowEnergyMode: boolean;
  recentFatigueAverage?: number | null;
  recentStressAverage?: number | null;
  recentSleepAverage?: number | null;
  hasTodayEntry: boolean;
  recentCheckIns: number;
  currentHour: number;
  reducedInteractionTolerance?: boolean;
};

export type AdaptiveHomeLayout = {
  level: "standard" | "lighter" | "minimal";
  maxReflectionCards: number;
  maxQuickLinks: number;
  maxGuidanceActions: number;
  showSecondaryProgram: boolean;
  showWins: boolean;
  showRecentAction: boolean;
};

export type DailySupportPriority = {
  primarySupport: "grounding" | "low-energy" | "sleep" | "reflection" | "continuity";
  summary: string;
};

export type ContextualCalmness = {
  title: string;
  body: string;
  toneLine: string;
};

export type HomeDensityReduction = {
  collapseSecondaryModules: boolean;
  shortenSummaries: boolean;
  hideSecondaryAnalytics: boolean;
  simplifyActionsFirst: boolean;
};

export type PremiumAdaptiveHomeState = {
  available: boolean;
  active: boolean;
  layout: AdaptiveHomeLayout;
  supportPriority: DailySupportPriority;
  calmness: ContextualCalmness;
  density: HomeDensityReduction;
};

function hasHeavyFatigue(input: AdaptiveHomeInput) {
  return typeof input.recentFatigueAverage === "number" && input.recentFatigueAverage >= 3.8;
}

function hasHeavyStress(input: AdaptiveHomeInput) {
  return typeof input.recentStressAverage === "number" && input.recentStressAverage >= 3.8;
}

function hasLowSleep(input: AdaptiveHomeInput) {
  return typeof input.recentSleepAverage === "number" && input.recentSleepAverage > 0 && input.recentSleepAverage < 6.3;
}

function hasHeavyDay(input: AdaptiveHomeInput) {
  return (
    input.lowEnergyMode ||
    hasHeavyFatigue(input) ||
    hasHeavyStress(input) ||
    hasLowSleep(input) ||
    Boolean(input.reducedInteractionTolerance)
  );
}

export function deriveAdaptiveHomeLayout(input: AdaptiveHomeInput): AdaptiveHomeLayout {
  if (!input.hasPremiumAccess || !input.featureEnabled) {
    return {
      level: "standard",
      maxReflectionCards: 3,
      maxQuickLinks: 3,
      maxGuidanceActions: 2,
      showSecondaryProgram: true,
      showWins: true,
      showRecentAction: true,
    };
  }

  if (hasHeavyDay(input)) {
    return {
      level: "minimal",
      maxReflectionCards: 1,
      maxQuickLinks: 2,
      maxGuidanceActions: 1,
      showSecondaryProgram: false,
      showWins: false,
      showRecentAction: false,
    };
  }

  if (input.recentCheckIns >= 5 && input.hasTodayEntry) {
    return {
      level: "standard",
      maxReflectionCards: 3,
      maxQuickLinks: 3,
      maxGuidanceActions: 2,
      showSecondaryProgram: true,
      showWins: true,
      showRecentAction: true,
    };
  }

  return {
    level: "lighter",
    maxReflectionCards: 2,
    maxQuickLinks: 2,
    maxGuidanceActions: 2,
    showSecondaryProgram: false,
    showWins: true,
    showRecentAction: true,
  };
}

export function deriveDailySupportPriority(input: AdaptiveHomeInput): DailySupportPriority {
  if (hasLowSleep(input) && input.currentHour >= 18) {
    return {
      primarySupport: "sleep",
      summary: "A quieter evening may help today settle.",
    };
  }

  if (input.lowEnergyMode || hasHeavyFatigue(input)) {
    return {
      primarySupport: "low-energy",
      summary: "Keeping things simpler today may feel easier.",
    };
  }

  if (hasHeavyStress(input)) {
    return {
      primarySupport: "grounding",
      summary: "A quieter pace may help today.",
    };
  }

  if (input.recentCheckIns >= 4) {
    return {
      primarySupport: "continuity",
      summary: "Some patterns may be getting easier to notice.",
    };
  }

  return {
    primarySupport: "reflection",
    summary: "A brief check-in may be enough today.",
  };
}

export function deriveContextualCalmness(input: AdaptiveHomeInput): ContextualCalmness {
  const heavyDay = hasHeavyDay(input);

  if (heavyDay) {
    return {
      title: "Keep today lighter",
      body: "Some days may need less pressure, fewer decisions, and a quieter pace.",
      toneLine: "A calmer home view can help the day feel a little easier to hold.",
    };
  }

  if (input.recentCheckIns >= 5) {
    return {
      title: "A steadier view of today",
      body: "With a little more context, the app can keep the most useful supports closer at hand.",
      toneLine: "Nothing here needs to become dense just because more context exists.",
    };
  }

  return {
    title: "A quieter way in",
    body: "The app can keep today a little simpler while still leaving fuller support nearby.",
    toneLine: "Calmer guidance can stay brief and optional.",
  };
}

export function deriveHomeDensityReduction(input: AdaptiveHomeInput): HomeDensityReduction {
  const heavyDay = hasHeavyDay(input);

  return {
    collapseSecondaryModules: heavyDay,
    shortenSummaries: heavyDay,
    hideSecondaryAnalytics: heavyDay,
    simplifyActionsFirst: heavyDay || input.currentHour < 12,
  };
}

export function derivePremiumAdaptiveHome(input: AdaptiveHomeInput): PremiumAdaptiveHomeState {
  const available = input.hasPremiumAccess && input.featureEnabled;
  const active = available;

  return {
    available,
    active,
    layout: deriveAdaptiveHomeLayout(input),
    supportPriority: deriveDailySupportPriority(input),
    calmness: deriveContextualCalmness(input),
    density: deriveHomeDensityReduction(input),
  };
}
