import { useEffect, useState } from "react";
import { useAuth } from "../auth/hooks";
import { useCompleteOnboarding, useMyProfile, useSaveProfileStep } from "../profile/hooks";
import type { ProfileUpdateInput } from "../profile/api";
import { normalizeError } from "../../lib/errors";
import { trackDiagnosticEvent, trackEvent } from "../../lib/events";
import { logger } from "../../lib/logger";
import type { ConsentState, OnboardingDraft } from "./types";
import {
  getSelectedOnboardingFocus,
  getSelectedOnboardingFocuses,
  getSelectedOnboardingPriorities,
  getSelectedOnboardingPriority,
} from "./personalization";

const EMPTY_DRAFT: OnboardingDraft = {
  display_name: "",
  ms_type: "",
  year_diagnosed: "",
  symptoms: [],
  goals: [],
  country: "",
  age_range: "",
};

const EMPTY_CONSENT: ConsentState = {
  medical_disclaimer: false,
  health_data: false,
  not_medical: false,
  data_control: false,
};

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

    setDraft({
      display_name: profile?.display_name ?? "",
      ms_type: profile?.ms_type ?? "",
      year_diagnosed: profile?.year_diagnosed ?? "",
      symptoms: profile?.symptoms ?? [],
      goals: profile?.goals ?? [],
      country: profile?.country ?? "",
      age_range: profile?.age_range ?? "",
    });
  }, [profileQuery.data]);

  async function saveStep(input: ProfileUpdateInput): Promise<boolean> {
    if (!user?.id || saveProfileStep.isPending) {
      return false;
    }

    try {
      await saveProfileStep.mutateAsync({ userId: user.id, input });
      return true;
    } catch {
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
      symptoms: draft.symptoms ?? [],
      goals: draft.goals ?? [],
      country: draft.country || null,
      age_range: draft.age_range || null,
    };

    try {
      logger.info("Completing onboarding", {
        userId: user.id,
        input,
      });

      const payload = await completeOnboardingMutation.mutateAsync({
        userId: user.id,
        input,
      });

      logger.info("Onboarding completion succeeded", {
        userId: user.id,
        payload,
      });
      await trackEvent("onboarding_completed", {
        userId: user.id,
        focus: getSelectedOnboardingFocus(draft) ?? "unknown",
        priority: getSelectedOnboardingPriority(draft) ?? "unknown",
        focusCount: getSelectedOnboardingFocuses(draft).length,
        priorityCount: getSelectedOnboardingPriorities(draft).length,
        focuses: getSelectedOnboardingFocuses(draft).join("|") || "unknown",
        priorities: getSelectedOnboardingPriorities(draft).join("|") || "unknown",
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

export { useSaveProfileStep } from "../profile/hooks";
