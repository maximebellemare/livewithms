import { useEffect, useMemo, useState } from "react";
import { deriveCalmEnvironment } from "../../lib/calm-environment";
import { useLowEnergyMode } from "../low-energy-mode/hooks";
import { DEFAULT_CALM_ENVIRONMENT_STATE, loadCalmEnvironmentState, saveCalmEnvironmentState } from "./storage";
import type { AppearancePreference, CalmDensityMode, CalmEnvironmentState } from "./types";

type Listener = (state: CalmEnvironmentState) => void;

const listeners = new Set<Listener>();
let currentCalmEnvironmentState: CalmEnvironmentState = DEFAULT_CALM_ENVIRONMENT_STATE;
let hasHydratedCalmEnvironmentState = false;
let hydrationPromise: Promise<CalmEnvironmentState> | null = null;

function notifyCalmEnvironmentListeners(state: CalmEnvironmentState) {
  listeners.forEach((listener) => listener(state));
}

async function hydrateCalmEnvironmentState() {
  if (hasHydratedCalmEnvironmentState) {
    return currentCalmEnvironmentState;
  }

  if (!hydrationPromise) {
    hydrationPromise = loadCalmEnvironmentState().then((state) => {
      currentCalmEnvironmentState = state;
      hasHydratedCalmEnvironmentState = true;
      notifyCalmEnvironmentListeners(state);
      return state;
    });
  }

  return hydrationPromise;
}

async function saveState(nextState: CalmEnvironmentState) {
  currentCalmEnvironmentState = nextState;
  hasHydratedCalmEnvironmentState = true;
  notifyCalmEnvironmentListeners(nextState);
  await saveCalmEnvironmentState(nextState);
  return nextState;
}

export async function setCalmEnvironmentReducedMotion(reducedMotion: boolean) {
  return saveState({
    ...currentCalmEnvironmentState,
    reducedMotion,
    updatedAt: new Date().toISOString(),
  });
}

export async function setCalmEnvironmentSofterHaptics(softerHaptics: boolean) {
  return saveState({
    ...currentCalmEnvironmentState,
    softerHaptics,
    updatedAt: new Date().toISOString(),
  });
}

export async function setCalmEnvironmentNightCalm(nightCalm: boolean) {
  return saveState({
    ...currentCalmEnvironmentState,
    nightCalm,
    updatedAt: new Date().toISOString(),
  });
}

export async function setCalmEnvironmentDensity(density: CalmDensityMode) {
  return saveState({
    ...currentCalmEnvironmentState,
    density,
    updatedAt: new Date().toISOString(),
  });
}

export async function setCalmEnvironmentAppearance(appearance: AppearancePreference) {
  return saveState({
    ...currentCalmEnvironmentState,
    appearance,
    updatedAt: new Date().toISOString(),
  });
}

export function useCalmEnvironment() {
  const [state, setState] = useState<CalmEnvironmentState>(currentCalmEnvironmentState);
  const [isLoading, setIsLoading] = useState(!hasHydratedCalmEnvironmentState);

  useEffect(() => {
    const listener: Listener = (nextState) => {
      setState(nextState);
      setIsLoading(false);
    };

    listeners.add(listener);
    void hydrateCalmEnvironmentState().then((nextState) => {
      listener(nextState);
    });

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return useMemo(
    () => ({
      ...state,
      isLoading,
      setReducedMotion: setCalmEnvironmentReducedMotion,
      setSofterHaptics: setCalmEnvironmentSofterHaptics,
      setNightCalm: setCalmEnvironmentNightCalm,
      setDensity: setCalmEnvironmentDensity,
      setAppearance: setCalmEnvironmentAppearance,
    }),
    [isLoading, state],
  );
}

export function useDerivedCalmEnvironment(input?: {
  recentFatigueAverage?: number | null;
  recentStressAverage?: number | null;
  recentSleepAverage?: number | null;
  overwhelmDetected?: boolean;
  timeOfDay?: "morning" | "afternoon" | "evening";
}) {
  const calmEnvironment = useCalmEnvironment();
  const lowEnergyMode = useLowEnergyMode();

  return useMemo(
    () =>
      deriveCalmEnvironment({
        hasPremiumAccess: true,
        featureEnabled: true,
        lowEnergyModeEnabled: lowEnergyMode.enabled,
        reducedMotionPreference: calmEnvironment.reducedMotion,
        softerHapticsPreference: calmEnvironment.softerHaptics,
        nightCalmPreference: calmEnvironment.nightCalm,
        densityPreference: calmEnvironment.density,
        interactionTolerance: lowEnergyMode.enabled ? "reduced" : "steady",
        recentFatigueAverage: input?.recentFatigueAverage ?? null,
        recentStressAverage: input?.recentStressAverage ?? null,
        recentSleepAverage: input?.recentSleepAverage ?? null,
        overwhelmDetected: input?.overwhelmDetected,
        timeOfDay:
          input?.timeOfDay ??
          (new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"),
      }),
    [
      calmEnvironment.density,
      calmEnvironment.nightCalm,
      calmEnvironment.reducedMotion,
      calmEnvironment.softerHaptics,
      input?.overwhelmDetected,
      input?.recentFatigueAverage,
      input?.recentSleepAverage,
      input?.recentStressAverage,
      input?.timeOfDay,
      lowEnergyMode.enabled,
    ],
  );
}
