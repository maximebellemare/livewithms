import { useMemo } from "react";
import { useProfile } from "./useProfile";
import { usePremium } from "./usePremium";
import { differenceInHours } from "date-fns";

const TRIAL_DURATION_HOURS = 72; // 3 days

export interface TrialState {
  /** User is currently in an active trial (not yet expired, no paid sub) */
  isInTrial: boolean;
  /** Trial has expired and user did not subscribe */
  trialExpired: boolean;
  /** Hours remaining in the trial (0 if expired/not in trial) */
  hoursRemaining: number;
  /** Days remaining (rounded up) */
  daysRemaining: number;
  /** Whether user has ever had a trial */
  hadTrial: boolean;
  /** Loading state */
  isLoading: boolean;
}

export const useTrial = (): TrialState => {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { hasRealSubscription, isLoading: premiumLoading } = usePremium();

  return useMemo(() => {
    if (profileLoading || premiumLoading || !profile) {
      return {
        isInTrial: false,
        trialExpired: false,
        hoursRemaining: 0,
        daysRemaining: 0,
        hadTrial: false,
        isLoading: true,
      };
    }

    // If user has a real paid subscription, trial state is irrelevant
    if (hasRealSubscription) {
      return {
        isInTrial: false,
        trialExpired: false,
        hoursRemaining: 0,
        daysRemaining: 0,
        hadTrial: !!profile.trial_started_at,
        isLoading: false,
      };
    }

    const trialStart = profile.trial_started_at;
    if (!trialStart) {
      return {
        isInTrial: false,
        trialExpired: false,
        hoursRemaining: 0,
        daysRemaining: 0,
        hadTrial: false,
        isLoading: false,
      };
    }

    const elapsed = differenceInHours(new Date(), new Date(trialStart));
    const remaining = Math.max(0, TRIAL_DURATION_HOURS - elapsed);
    const isInTrial = remaining > 0;

    return {
      isInTrial,
      trialExpired: !isInTrial,
      hoursRemaining: remaining,
      daysRemaining: Math.ceil(remaining / 24),
      hadTrial: true,
      isLoading: false,
    };
  }, [profile, profileLoading, premiumLoading, hasRealSubscription]);
};
