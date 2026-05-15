import { deriveCollectiveThemes } from "./ambient-belonging/deriveCollectiveThemes";
import { generateSeasonalResonance } from "./ambient-belonging/generateSeasonalResonance";
import { deriveConnectionFatigueState } from "./connection-fatigue/deriveConnectionFatigueState";
import { deriveSocialDensity } from "./connection-fatigue/deriveSocialDensity";
import { preventPopularityDynamics } from "./non-performative-design/preventPopularityDynamics";
import { removeEngagementSignals } from "./non-performative-design/removeEngagementSignals";
import { deriveConsentBoundaries } from "./privacy-first/deriveConsentBoundaries";
import { deriveVisibilityRules } from "./privacy-first/deriveVisibilityRules";
import { deriveSharedThemes } from "./quiet-reflections/deriveSharedThemes";
import { generateAmbientConnection } from "./quiet-reflections/generateAmbientConnection";

export function buildHumanConnectionSnapshot(input: {
  stressTrend: "steady" | "elevated";
  sleepTrend: "steady" | "low";
  reflectionPattern: "quiet" | "active";
  lowEnergyMode: boolean;
  season: "winter" | "spring" | "summer" | "autumn" | "unknown";
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  hasStackedEmotionalSurfaces: boolean;
  aiSummaryVisible: boolean;
  notePreview?: string | null;
}) {
  const collectiveThemes = deriveCollectiveThemes(input);
  const sharedThemes = deriveSharedThemes(collectiveThemes);
  const fatigueState = deriveConnectionFatigueState({
    adaptiveStatePrimary: input.adaptiveStatePrimary,
    hasStackedEmotionalSurfaces: input.hasStackedEmotionalSurfaces,
    aiSummaryVisible: input.aiSummaryVisible,
    notePreview: input.notePreview,
  });
  const socialDensity = deriveSocialDensity(fatigueState);
  const visibility = deriveVisibilityRules();
  const consent = deriveConsentBoundaries();
  const nonPerformative = preventPopularityDynamics({});
  const ambientConnection =
    fatigueState === "open" ? generateAmbientConnection(sharedThemes) : null;
  const seasonalResonance =
    fatigueState === "suppressed" ? null : generateSeasonalResonance(input.season);

  return {
    collectiveThemes,
    sharedThemes,
    fatigueState,
    socialDensity,
    visibility,
    consent,
    nonPerformative,
    ambientConnection: ambientConnection
      ? { ...ambientConnection, body: removeEngagementSignals(ambientConnection.body) }
      : null,
    seasonalResonance: seasonalResonance
      ? { ...seasonalResonance, body: removeEngagementSignals(seasonalResonance.body) }
      : null,
  };
}

