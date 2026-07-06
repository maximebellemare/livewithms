import { useEffect, useState } from "react";
import { useAuth } from "../auth/hooks";
import { useCompleteOnboarding, useMyProfile, useSaveProfileStep } from "../profile/hooks";
import type { ProfileUpdateInput } from "../profile/api";
import { normalizeError } from "../../lib/errors";
import { trackDiagnosticEvent, trackEvent } from "../../lib/events";
import { logger } from "../../lib/logger";
import type { ConsentState, OnboardingDraft } from "./types";
import {
  buildOnboardingGoals,
  buildOnboardingSymptoms,
  hydrateChallengesFromSymptoms,
  hydrateHelpFirstFromGoals,
  hydrateTrackingFromSymptoms,
  getSelectedOnboardingFocus,
  getSelectedOnboardingFocuses,
  getSelectedOnboardingPriorities,
  getSelectedOnboardingPriority,
  mapStoredSupportStyleToOnboardingChoice,
} from "./personalization";
import { loadLowEnergyModeState } from "../low-energy-mode/storage";
import { loadPersonalizationMemory } from "../personalization-memory/storage";
import { loadReminderSettings } from "../reminders/storage";

const EMPTY_DRAFT: OnboardingDraft = {
  display_name: "",
  ms_type: "",
  year_diagnosed: "",
  symptoms: [],
  goals: [],
  hardest_challenges: [],
  hardest_challenges_custom: "",
  tracking_focuses: [],
  tracking_focuses_custom: "",
  help_first: [],
  motivation_level: "",
  country: "",
  age_range: "",
  support_style: "",
  low_energy_mode: false,
  reminder_preference: "skip",
};

const EMPTY_CONSENT: ConsentState = {
  medical_disclaimer: false,
  health_data: false,
  not_medical: false,
  data_control: false,
};

async function pause(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldRetryProfileWrite(error: unknown) {
  const normalizedError = normalizeError(error);
  const message = normalizedError.message.toLowerCase();
  const details = `${normalizedError.details ?? ""} ${normalizedError.hint ?? ""}`.toLowerCase();

  return (
    message.includes("network") ||
    message.includes("timed out") ||
    details.includes("network") ||
    details.includes("timeout") ||
    details.includes("temporar")
  );
}

export function useOnboarding() {
  const { user } = useAuth();
  const profileQuery = useMyProfile(user?.id);
  const saveProfileStep = useSaveProfileStep();
  const completeOnboardingMutation = useCompleteOnboarding();
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_DRAFT);
  const [consent, setConsent] = useState<ConsentState>(EMPTY_CONSENT);

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) {
      return;
    }

    setDraft((current) => ({
      ...currentDraftDefaults(current),
      display_name: profile?.display_name ?? "",
      ms_type: profile?.ms_type ?? "",
      year_diagnosed: profile?.year_diagnosed ?? "",
      symptoms: profile?.symptoms ?? [],
      goals: profile?.goals ?? [],
      hardest_challenges: hydrateChallengesFromSymptoms(profile?.symptoms ?? []).selected,
      hardest_challenges_custom: hydrateChallengesFromSymptoms(profile?.symptoms ?? []).customText,
      tracking_focuses: hydrateTrackingFromSymptoms(profile?.symptoms ?? []).selected,
      tracking_focuses_custom: hydrateTrackingFromSymptoms(profile?.symptoms ?? []).customText,
      help_first: hydrateHelpFirstFromGoals(profile?.goals ?? []),
      country: profile?.country ?? "",
      age_range: profile?.age_range ?? "",
    }));
  }, [profileQuery.data]);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([loadPersonalizationMemory(), loadLowEnergyModeState(), loadReminderSettings()]).then(
      ([memory, lowEnergyMode, reminderSettings]) => {
        if (cancelled) {
          return;
        }

        setDraft((current) => ({
          ...current,
          support_style:
            current.support_style ||
            mapStoredSupportStyleToOnboardingChoice({
              supportStyle: memory.onboardingSupportStyleOverride ?? memory.preferredSupportStyle,
              lowEnergyMode: lowEnergyMode.enabled,
            }),
          low_energy_mode: lowEnergyMode.enabled,
          reminder_preference: reminderSettings.enabled ? "enable" : "skip",
          hardest_challenges:
            current.hardest_challenges.length > 0
              ? current.hardest_challenges
              : memory.onboardingChallenges ?? current.hardest_challenges,
          hardest_challenges_custom:
            current.hardest_challenges_custom || memory.onboardingChallengesCustom || "",
          tracking_focuses:
            current.tracking_focuses.length > 0
              ? current.tracking_focuses
              : memory.onboardingTrackingFocuses ?? current.tracking_focuses,
          tracking_focuses_custom:
            current.tracking_focuses_custom || memory.onboardingTrackingFocusesCustom || "",
          help_first:
            current.help_first.length > 0 ? current.help_first : memory.onboardingHelpFirst ?? current.help_first,
          motivation_level: current.motivation_level || memory.onboardingMotivationLevel || "",
        }));
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveStep(input: ProfileUpdateInput): Promise<boolean> {
    if (!user?.id || saveProfileStep.isPending) {
      return false;
    }

    try {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          console.log("[onboarding] step save start", {
            userId: user.id,
            payload: input,
            attempt,
          });
          await saveProfileStep.mutateAsync({ userId: user.id, input });
          console.log("[onboarding] step save success", {
            userId: user.id,
            payload: input,
            attempt,
          });
          return true;
        } catch (error) {
          const normalizedError = normalizeError(error);
          console.error("[onboarding] step save failure", {
            userId: user.id,
            payload: input,
            attempt,
            message: normalizedError.message,
            code: normalizedError.code,
            details: normalizedError.details,
            hint: normalizedError.hint,
          });

          if (attempt >= 2 || !shouldRetryProfileWrite(error)) {
            return false;
          }

          await pause(700);
        }
      }
    } catch (error) {
      const normalizedError = normalizeError(error);
      console.error("[onboarding] step save failure", {
        userId: user.id,
        payload: input,
        message: normalizedError.message,
        code: normalizedError.code,
        details: normalizedError.details,
        hint: normalizedError.hint,
      });
      return false;
    }
  }

  async function completeOnboarding(): Promise<boolean> {
    if (!user?.id || completeOnboardingMutation.isPending) {
      logger.error("Complete onboarding blocked", {
        userId: user?.id ?? null,
        isPending: completeOnboardingMutation.isPending,
      });
      return false;
    }

    const input: ProfileUpdateInput = {
      onboarding_completed: true,
      display_name: draft.display_name || null,
      ms_type: draft.ms_type || null,
      year_diagnosed: draft.year_diagnosed || null,
      symptoms: buildOnboardingSymptoms(draft),
      goals: buildOnboardingGoals(draft),
      country: draft.country || null,
      age_range: draft.age_range || null,
    };

    try {
      logger.info("Completing onboarding", {
        userId: user.id,
        input,
      });

      let payload: Awaited<ReturnType<typeof completeOnboardingMutation.mutateAsync>> | null = null;
      let success = false;

      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          console.log("[onboarding] completion save start", {
            userId: user.id,
            payload: input,
            attempt,
          });
          payload = await completeOnboardingMutation.mutateAsync({
            userId: user.id,
            input,
          });
          console.log("[onboarding] completion save success", {
            userId: user.id,
            attempt,
          });
          success = true;
          break;
        } catch (error) {
          const normalizedError = normalizeError(error);
          console.error("[onboarding] completion save failure", {
            userId: user.id,
            attempt,
            message: normalizedError.message,
            code: normalizedError.code,
            details: normalizedError.details,
            hint: normalizedError.hint,
          });

          if (attempt >= 2 || !shouldRetryProfileWrite(error)) {
            throw error;
          }

          await pause(700);
        }
      }

      if (!success || !payload) {
        throw new Error("Could not save profile. Please try again.");
      }

      logger.info("Onboarding completion succeeded", {
        userId: user.id,
        payload,
      });
      await profileQuery.refetch();
      await trackEvent("onboarding_completed", {
        userId: user.id,
        focus: getSelectedOnboardingFocus(draft) ?? "unknown",
        priority: getSelectedOnboardingPriority(draft) ?? "unknown",
        focusCount: getSelectedOnboardingFocuses(draft).length,
        priorityCount: getSelectedOnboardingPriorities(draft).length,
        focuses: getSelectedOnboardingFocuses(draft).join("|") || "unknown",
        priorities: getSelectedOnboardingPriorities(draft).join("|") || "unknown",
        supportStyle: draft.support_style || "unknown",
        lowEnergyMode: draft.low_energy_mode,
        reminders: draft.reminder_preference,
      });
      return true;
    } catch (error) {
      const normalizedError = normalizeError(error);
      await trackDiagnosticEvent("onboarding_completion_failed", {
        code: normalizedError.code ?? "unknown",
      });
      logger.error("Onboarding completion failed", {
        userId: user.id,
        input,
        code: normalizedError.code,
        details: normalizedError.details,
        hint: normalizedError.hint,
        message: normalizedError.message,
        error,
      });
      return false;
    }
  }

  return {
    userId: user?.id ?? null,
    profile: profileQuery.data,
    isProfileLoading: profileQuery.isLoading,
    draft,
    consent,
    setDraft,
    setConsent,
    saveStep,
    completeOnboarding,
    isSavingStep: saveProfileStep.isPending,
    isCompleting: completeOnboardingMutation.isPending,
  };
}

function currentDraftDefaults(draft: OnboardingDraft): OnboardingDraft {
  return {
    ...EMPTY_DRAFT,
    hardest_challenges: draft.hardest_challenges,
    hardest_challenges_custom: draft.hardest_challenges_custom,
    tracking_focuses: draft.tracking_focuses,
    tracking_focuses_custom: draft.tracking_focuses_custom,
    help_first: draft.help_first,
    motivation_level: draft.motivation_level,
    support_style: draft.support_style,
    low_energy_mode: draft.low_energy_mode,
    reminder_preference: draft.reminder_preference,
  };
}

export { useSaveProfileStep } from "../profile/hooks";
