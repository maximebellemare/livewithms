import { appSecureStore } from "../../lib/secure-store";
import type { PersonalizationMemory } from "./types";
import type { InteractionStyleProfile } from "../../lib/personalization/types";

const PERSONALIZATION_MEMORY_KEY = "livewithms.personalization-memory";
let cachedPersonalizationMemory: PersonalizationMemory | null = null;
let cachedPersonalizationMemorySerialized: string | null = null;

const DEFAULT_INTERACTION_STYLE_PROFILE: InteractionStyleProfile = {
  weights: {
    concise: 0.5,
    reflective: 0.5,
    structured: 0.5,
    openEnded: 0.5,
    reassuranceLight: 0.5,
    reassuranceWarm: 0.5,
    practical: 0.5,
    emotionallyReflective: 0.5,
  },
  primaryStyle: "concise",
  confidence: 0.5,
};

const EMPTY_MEMORY: PersonalizationMemory = {
  onboardingGoals: [],
  onboardingSymptoms: [],
  preferredSupportStyle: "steady",
  preferredProgramTags: [],
  reminderWindow: "evening",
  reminderEnabled: false,
  engagementPattern: "unknown",
  recurringStressPattern: "unknown",
  recurringSleepPattern: "unknown",
  recurringFatiguePattern: "unknown",
  interactionStyleProfile: DEFAULT_INTERACTION_STYLE_PROFILE,
  coachTonePreference: "steady",
  reflectionTonePreference: "observational",
  preferredCheckinWindows: ["evening"],
  engagementRhythm: "light",
  recoveryRhythm: "quiet-reentry",
  reflectionDepthPreference: "balanced",
  promptStylePreference: "gentle-observational",
  complexityTolerance: "balanced",
  preferredDensity: "standard",
  updatedAt: null,
};

function sanitizeStringArray(value: unknown, maxLength: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string").slice(0, maxLength);
}

export async function loadPersonalizationMemory(): Promise<PersonalizationMemory> {
  if (cachedPersonalizationMemory) {
    return cachedPersonalizationMemory;
  }

  try {
    const raw = await appSecureStore.getItem(PERSONALIZATION_MEMORY_KEY);

    if (!raw) {
      cachedPersonalizationMemory = EMPTY_MEMORY;
      cachedPersonalizationMemorySerialized = JSON.stringify(EMPTY_MEMORY);
      return EMPTY_MEMORY;
    }

    const parsed = JSON.parse(raw) as Partial<PersonalizationMemory>;
    const nextValue = {
      ...EMPTY_MEMORY,
      ...parsed,
      onboardingGoals: sanitizeStringArray(parsed.onboardingGoals, 6),
      onboardingSymptoms: sanitizeStringArray(parsed.onboardingSymptoms, 6),
      preferredProgramTags: sanitizeStringArray(parsed.preferredProgramTags, 4) as PersonalizationMemory["preferredProgramTags"],
      preferredCheckinWindows: sanitizeStringArray(parsed.preferredCheckinWindows, 2) as PersonalizationMemory["preferredCheckinWindows"],
      interactionStyleProfile:
        parsed.interactionStyleProfile && typeof parsed.interactionStyleProfile === "object"
          ? {
              ...DEFAULT_INTERACTION_STYLE_PROFILE,
              ...(parsed.interactionStyleProfile as Partial<InteractionStyleProfile>),
              weights: {
                ...DEFAULT_INTERACTION_STYLE_PROFILE.weights,
                ...((parsed.interactionStyleProfile as Partial<InteractionStyleProfile>).weights ?? {}),
              },
            }
          : DEFAULT_INTERACTION_STYLE_PROFILE,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    };
    cachedPersonalizationMemory = nextValue;
    cachedPersonalizationMemorySerialized = JSON.stringify(nextValue);
    return nextValue;
  } catch {
    return EMPTY_MEMORY;
  }
}

export async function savePersonalizationMemory(memory: PersonalizationMemory) {
  try {
    const sanitized = {
      ...memory,
      onboardingGoals: memory.onboardingGoals.slice(0, 6),
      onboardingSymptoms: memory.onboardingSymptoms.slice(0, 6),
      preferredProgramTags: (memory.preferredProgramTags ?? []).slice(0, 4),
      preferredCheckinWindows: (memory.preferredCheckinWindows ?? []).slice(0, 2),
    };
    const serialized = JSON.stringify(sanitized);
    cachedPersonalizationMemory = sanitized;

    if (cachedPersonalizationMemorySerialized === serialized) {
      return;
    }

    cachedPersonalizationMemorySerialized = serialized;
    await appSecureStore.setItem(PERSONALIZATION_MEMORY_KEY, serialized);
  } catch {
    // Personalization memory should stay quiet and non-blocking.
  }
}
