import { useEffect, useMemo, useRef, useState } from "react";
import { buildPersonalizationMemory } from "./logic";
import { loadPersonalizationMemory, savePersonalizationMemory } from "./storage";
import type { PersonalizationMemory, PersonalizationMemoryInput } from "./types";

export function usePersonalizationMemory(input: PersonalizationMemoryInput) {
  const [storedMemory, setStoredMemory] = useState<PersonalizationMemory | null>(null);
  const [lastPersistedKey, setLastPersistedKey] = useState<string | null>(null);
  const persistedMemoryRef = useRef<PersonalizationMemory | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const loaded = await loadPersonalizationMemory();
      if (!cancelled) {
        persistedMemoryRef.current = loaded;
        setStoredMemory(loaded);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const memory = useMemo(
    () => buildPersonalizationMemory(input, persistedMemoryRef.current ?? storedMemory),
    [
      input.adaptiveProfile.engagementPattern,
      input.adaptiveProfile.fatigueTrend,
      input.adaptiveProfile.brainFogTrend,
      input.adaptiveProfile.lowEnergyMode,
      input.adaptiveProfile.sleepTrend,
      input.adaptiveProfile.stressTrend,
      input.growthState?.lastActiveAt,
      JSON.stringify(input.growthState?.recentActions ?? []),
      JSON.stringify(input.onboardingGoals),
      JSON.stringify(input.onboardingSymptoms),
      input.programProgress.activeToolId,
      input.programProgress.lastOpenedToolId,
      JSON.stringify(input.programProgress.completedToolIds),
      JSON.stringify(input.programProgress.toolProgress),
      JSON.stringify(input.recentEntries?.map((entry) => `${entry.date}:${entry.notes?.length ?? 0}:${entry.updated_at}`) ?? []),
      input.reminderSettings.enabled,
      input.reminderSettings.hour,
      input.reminderSettings.minute,
      storedMemory?.updatedAt,
    ],
  );

  const memoryKey = useMemo(
    () =>
      JSON.stringify({
        goals: memory.onboardingGoals,
        symptoms: memory.onboardingSymptoms,
        supportStyle: memory.preferredSupportStyle,
        programTags: memory.preferredProgramTags,
        reminderWindow: memory.reminderWindow,
        reminderEnabled: memory.reminderEnabled,
        coachTonePreference: memory.coachTonePreference,
        reflectionTonePreference: memory.reflectionTonePreference,
        preferredCheckinWindows: memory.preferredCheckinWindows,
        engagementRhythm: memory.engagementRhythm,
        recoveryRhythm: memory.recoveryRhythm,
        reflectionDepthPreference: memory.reflectionDepthPreference,
        promptStylePreference: memory.promptStylePreference,
        complexityTolerance: memory.complexityTolerance,
        preferredDensity: memory.preferredDensity,
        interactionStyleProfile: memory.interactionStyleProfile,
        engagementPattern: memory.engagementPattern,
        stress: memory.recurringStressPattern,
        sleep: memory.recurringSleepPattern,
        fatigue: memory.recurringFatiguePattern,
      }),
    [memory],
  );

  useEffect(() => {
    if (memoryKey === lastPersistedKey) {
      return;
    }

    persistedMemoryRef.current = memory;
    setLastPersistedKey(memoryKey);
    void savePersonalizationMemory(memory);
  }, [lastPersistedKey, memory, memoryKey]);

  return {
    memory,
    isLoading: storedMemory === null,
  };
}
