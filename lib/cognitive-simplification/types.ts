import type { LifecycleStage } from "../../features/lifecycle/logic";
import type { AdaptiveStateSignal } from "../longitudinal/types";

export type DisclosureDepth = "minimal" | "standard" | "expanded";
export type CognitiveBurden = "low" | "medium" | "high";
export type DecisionLoad = "low" | "medium" | "high";

export type SurfacePriorityInput = {
  adaptiveStatePrimary: AdaptiveStateSignal;
  lifecycleStage: LifecycleStage;
  hasTodayEntry?: boolean;
  hasAiSummary?: boolean;
  hasReflectionCards?: boolean;
};

export type SurfacePriority = "check-in" | "guidance" | "reflection" | "insights" | "re-entry";

export type DeferredContent = {
  hideCelebrations: boolean;
  hideProgress: boolean;
  hideSecondarySupport: boolean;
  hideSecondaryProgram: boolean;
  hideWins: boolean;
  hideBestWorstDay: boolean;
};

export type OptionalExpansion = {
  showProgress: boolean;
  showBestWorstDay: boolean;
  showSecondaryProgram: boolean;
  showSecondarySupport: boolean;
  showCelebrations: boolean;
};

export type NavigationPriority = {
  maxVisibleRoutes: number;
  preferredRoutes: Array<"/today" | "/coach" | "/track" | "/insights" | "/care" | "/programs" | "/health-summary">;
};

export type HiddenComplexity = DeferredContent;

export type ReflectionDensity = {
  maxCards: 0 | 1 | 2;
  allowDeeperCards: boolean;
};

export type InsightClustering = {
  maxCorrelations: number;
  showProgressSummary: boolean;
  showBestWorstDay: boolean;
  maxAiSuggestionItems: number;
};

export type SafeDefaults = {
  noteStarterCount: number;
  quickLinkCount: number;
};

export type AdaptiveDefaults = SafeDefaults & {
  useCondensedSpacing: boolean;
};

export type QuietMoment = {
  title: string;
  body: string;
} | null;

export type LowStimulusSurface = {
  title: string;
  body: string;
} | null;
